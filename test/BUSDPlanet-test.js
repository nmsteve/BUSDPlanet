
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber, utils } = require("ethers");

  let BEP20Deployed
  let BusdPlanetDeployed;
  let BUSDPlanetDividendTrackerDeployed
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addr6;
  let initialLiquidty;
  
  
  describe("BusdPlanet Testing", function () {

    beforeEach(async function () {

      //get signers
      [owner, addr1, addr2, addr3, addr4,addr5,addr6,...addrs] = await ethers.getSigners();
      
      //get contract factory
      const BEP20 = await ethers.getContractFactory("BEP20Token")
      const BusdPlanet =  await ethers.getContractFactory("BusdPlanet");
      const BUSDPlanetDividendTracker = await hre.ethers.getContractFactory("BusdPlanetDividendTracker");

      //Deploy BEP20 
      BEP20Deployed = await BEP20.deploy()
      await BEP20Deployed.deployed()

      //deploy BusdPlanet
      BusdPlanetDeployed = await BusdPlanet.deploy(process.env.ROUTER02, BEP20Deployed.address ,addr1.address, addr2.address, addr3.address);
      await BusdPlanetDeployed.deployed()

      //deploy BUSDPlanetDividendTracker
      BUSDPlanetDividendTrackerDeployed = await BUSDPlanetDividendTracker.deploy(BEP20Deployed.address,BusdPlanetDeployed.address)
      await BUSDPlanetDividendTrackerDeployed.deployed()

      //set provider 
      this.provider = ethers.provider;

        //set Pair
        //const pairAddress = await this.factorysigner.callStatic.createPair(process.env.giversEdited, process.env.WETH)
      this.pairAddress = BusdPlanetDeployed.defaultPair()
      this.pair = new ethers.Contract(
          this.pairAddress,
          ['function totalSupply() external view returns (uint)','function balanceOf(address owner) external view returns (uint)','function approve(address spender, uint value) external returns (bool)','function decimals() external pure returns (uint8)','function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
          this.provider
      )
      this.pairsigner =this.pair.connect(owner)

      //set Router
      this.router02 = new ethers.Contract(
      process.env.ROUTER02,
      ['function WETH() external pure returns (address)','function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)', 'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)', 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', 'function swapExactTokensForETHSupportingFeeOnTransferTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external','function removeLiquidityETHSupportingFeeOnTransferTokens( address token,uint liquidity,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external returns (uint amountETH)'], 
      this.provider);
      this.routersigner = this.router02.connect(owner)

      //Enable transfer
      await BusdPlanetDeployed.setTransfersEnabled(true)

      //Initialize devidend tracker             
      await  BusdPlanetDeployed.initializeDividendTracker(BUSDPlanetDividendTrackerDeployed.address)
      const ownerCheck =  await BusdPlanetDeployed.getOwner()
      expect(ownerCheck).to.be.equal(owner.address)

      await BusdPlanetDeployed.updateNameAndSymbol('VasRewards', 'VAS')

      //add liquidty
      await BusdPlanetDeployed.approve(process.env.ROUTER02, ethers.utils.parseEther("100000"));
      initialLiquidty = ethers.utils.parseEther('10000')
      await this.routersigner.addLiquidityETH(
        BusdPlanetDeployed.address,
        initialLiquidty,
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
        {value : ethers.utils.parseEther("100")}
        )
      
  

            
    });
  
    describe("Deployment", function () {

        it("Should set the right supply amount",async function (){
            expect(await BusdPlanetDeployed.totalSupply()).to.equal(ethers.utils.parseEther('10000000'))
        })

        it("Should assign the total supply - initialLiquidity tokens to the owner", async function () {
          const ownerBalance = await BusdPlanetDeployed.balanceOf(owner.address);

          expect(ethers.utils.parseEther('9990000')).to.equal(ownerBalance);
        });

      });

      describe("Transfer:Among token holders", function () {

        it("Should transfer with no fee ", async function () {
          // Transfer 50 tokens from owner to addr1
          const amount = ethers.utils.parseEther('50')
  
          await BusdPlanetDeployed.transfer(addr1.address,amount );
          const addr1Balance = await BusdPlanetDeployed.balanceOf(addr1.address);
          expect(addr1Balance).to.equal(amount);
  
          // Transfer 50 tokens from addr1 to addr2
          // We use .connect(signer) to send a transaction from another account
          await BusdPlanetDeployed.connect(addr1).transfer(addr2.address, amount);
          const addr2Balance = await BusdPlanetDeployed.balanceOf(addr2.address);
          expect(addr2Balance).to.equal(amount);
  
          //Treansfer back to owner  
          await BusdPlanetDeployed.connect(addr2).transfer(owner.address, amount);
          const ownerBalance = await BusdPlanetDeployed.balanceOf(owner.address);
          expect(ownerBalance/10**18).to.equal(9990000);
  
        });
  
        it('Should allow owner to send and receive more than maxwallentToken amount', async function(){
           //check the maxmum wallent token amount (expect == 200k)
          const maxBal = await BusdPlanetDeployed.maxWalletToken()
          expect(maxBal).to.be.equal(ethers.utils.parseEther('200000'))

          //Transfer from owner to addr1 more than 200K (expect addr1bal == 300k)
          await BusdPlanetDeployed.transfer(addr1.address, utils.parseEther('300000'))
          const addr1Bal = await BusdPlanetDeployed.balanceOf(addr1.address)
          expect(addr1Bal).to.be.equals(utils.parseEther('300000'))

          //Tranfer back to owner (expect owner bal == supply - intialliquidity)
          await BusdPlanetDeployed.connect(addr1).transfer(owner.address, utils.parseEther('300000'))
          expect(await BusdPlanetDeployed.balanceOf(owner.address)).to.be.equals(utils.parseEther('9990000'))

        });

        it('Should not allow other holders to send more than MaxWallentToken amount', async function(){
          //Transfer from owner to addr4 more than 200K (expect addr4bal == 300k)
          await BusdPlanetDeployed.transfer(addr4.address, utils.parseEther('300000'))
          const addr4Bal = await BusdPlanetDeployed.balanceOf(addr4.address)
          expect(addr4Bal).to.be.equals(utils.parseEther('300000'))

          //Transfer from addr4 to addr5 more than 200k (expect revert, "BUSDPlanet: Exceeds maximum wallet token amount." )
         await expect(BusdPlanetDeployed.connect(addr4).transfer(addr5.address, utils.parseEther('250000'))).to.be.revertedWith('BUSDPlanet: Exceeds maximum wallet token amount')

        })
        
      });

      describe('Swap:BPT-ETH pool',function () {
        it("should take sell fees", async function(){
          //Transfer 100 from owner to addr4
          await BusdPlanetDeployed.transfer(addr4.address, utils.parseEther('100'))
          expect(await BusdPlanetDeployed.balanceOf(addr4.address)).to.be.equal(utils.parseEther('100'))

          //swap 50 token in to recieve ETH
          this.routersigner = await this.router02.connect(addr4)
          await BusdPlanetDeployed.connect(addr4).approve(process.env.ROUTER02,utils.parseEther('50'))

          const WETH = await this.routersigner.WETH()
          const path = [BusdPlanetDeployed.address,WETH]
          
          await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
            utils.parseEther('50'),
            0,
            path,
            addr4.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
          )

          expect(await BusdPlanetDeployed.balanceOf(addr4.address)).to.be.equal(utils.parseEther('50'))
          expect(await BusdPlanetDeployed.balanceOf(BusdPlanetDeployed.address)/10**18).to.be.equal(6)

        })

      });

  })
