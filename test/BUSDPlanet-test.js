
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
  let addr7
  let initialLiquidty;
  
  
  describe("BusdPlanet Testing", function () {

    beforeEach(async function () {

      //get signers
      [owner, addr1, addr2, addr3, addr4, addr5,addr6,addr7,...addrs] = await ethers.getSigners();
      
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

      //set defaultPair
      this.pairAddress = BusdPlanetDeployed.defaultPair()
      this.pair = new ethers.Contract(
          this.pairAddress,
          ['function totalSupply() external view returns (uint)','function balanceOf(address owner) external view returns (uint)','function approve(address spender, uint value) external returns (bool)','function decimals() external pure returns (uint8)','function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
          this.provider
      )
      this.pairsigner =this.pair.connect(owner)
      

      
      //set Factory
      this.factory = new ethers.Contract(
        process.env.FACTORY,
        ['function getPair(address tokenA, address tokenB) external view returns (address pair)','function createPair(address tokenA, address tokenB) external returns (address pair)'],
        this.provider
      )
      this.factorySigner =  this.factory.connect(owner)

      //create WETH-BUSD pair
      await this.factorySigner.createPair(BEP20Deployed.address,process.env.WETH)
      this.BusdPairAddress = await this.factorySigner.getPair(BEP20Deployed.address,process.env.WETH)
      //console.log('WETH_BUSD Pair address',this.BusdPairAddress)

      this.BusdPairSigner = new ethers.Contract(
        this.pairAddress,
        ['function totalSupply() external view returns (uint)','function balanceOf(address owner) external view returns (uint)','function approve(address spender, uint value) external returns (bool)','function decimals() external pure returns (uint8)','function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
        this.provider
      )
      this.BusdPairSigner = this.BusdPairSigner.connect(owner)

      

      //set Router
      this.router02 = new ethers.Contract(
      process.env.ROUTER02,
      ['function swapExactETHForTokensSupportingFeeOnTransferTokens( uint amountOutMin,address[] calldata path,address to,uint deadline) external payable','function WETH() external pure returns (address)','function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)', 'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)', 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', 'function swapExactTokensForETHSupportingFeeOnTransferTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external','function removeLiquidityETHSupportingFeeOnTransferTokens( address token,uint liquidity,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external returns (uint amountETH)'], 
      this.provider);
      this.routersigner = this.router02.connect(owner)


      //Enable transfer
      await BusdPlanetDeployed.setTransfersEnabled(true)

      //Initialize devidend tracker             
      await  BusdPlanetDeployed.initializeDividendTracker(BUSDPlanetDividendTrackerDeployed.address)
      const ownerCheck =  await BusdPlanetDeployed.getOwner()
      expect(ownerCheck).to.be.equal(owner.address)

      //Top ETH from other accounts
      addr1.sendTransaction({to: owner.address,value: ethers.utils.parseEther("2000")})
      addr2.sendTransaction({to: owner.address,value: ethers.utils.parseEther("2000")})
      addr3.sendTransaction({to: owner.address,value: ethers.utils.parseEther("2000")})

      initialLiquidty = ethers.utils.parseEther('1000000')

      //add liquidty WETH-BTP
      await BusdPlanetDeployed.approve(process.env.ROUTER02, ethers.utils.parseEther("1000000"));
      await this.routersigner.addLiquidityETH(
        BusdPlanetDeployed.address,
        initialLiquidty,
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
        {value : ethers.utils.parseEther("1000")}
        )
        
        //add liquidity WETH-BUSD
        await BEP20Deployed.approve(process.env.ROUTER02, utils.parseEther("1000000"));
        await this.routersigner.addLiquidityETH(
          BEP20Deployed.address,
          initialLiquidty,
          0,
          0,
          owner.address,
          Math.floor(Date.now() / 1000) + 60 * 10,
         {value : ethers.utils.parseEther("1000") }
        )


       
    });


    describe("Deployment", function () {


        it("Should set the right supply amount",async function (){
            expect(await BusdPlanetDeployed.totalSupply()).to.equal(ethers.utils.parseEther('10000000'))
            expect(await BEP20Deployed.totalSupply()).to.equal(ethers.utils.parseEther('31000000'))
        })

        it("Should assign the total supply tokens to the owner", async function () {
          const ownerBalanceBPT = await BusdPlanetDeployed.balanceOf(owner.address);
          const ownerBalanceBUSD = await BEP20Deployed.balanceOf(owner.address)

          expect(ethers.utils.parseEther('9000000')).to.equal(ownerBalanceBPT);
          expect(ethers.utils.parseEther('30000000')).to.equal(ownerBalanceBUSD);

        });

        it('Set other state valiables to right values',async function(){

         expect(await BusdPlanetDeployed.transfersEnabled()).to.be.equal(true) 
         expect(await BusdPlanetDeployed.gasForProcessing()).to.be.equal(30000000)
         expect(await BusdPlanetDeployed.defaultDexRouter()).to.be.equal(process.env.ROUTER02)
         expect(await BusdPlanetDeployed.defaultPair()).to.be.equal( await this.pairAddress)

        })

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
          expect(ownerBalance/10**18).to.equal(9000000);
  
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
          expect(await BusdPlanetDeployed.balanceOf(owner.address)).to.be.equals(utils.parseEther('9000000'))

        });

        it('Should not allow other holders to send more than MaxWallentToken amount', async function(){
          //Transfer from owner to addr4 more than 200K (expect addr4bal == 300k)
          await BusdPlanetDeployed.transfer(addr5.address, utils.parseEther('300000'))
          const addr5Bal = await BusdPlanetDeployed.balanceOf(addr5.address)
          expect(addr5Bal).to.be.equals(utils.parseEther('300000'))



          //Transfer from addr4 to addr5 more than 200k (expect revert, "BUSDPlanet: Exceeds maximum wallet token amount." )
         await expect(BusdPlanetDeployed.connect(addr5).transfer(addr6.address, utils.parseEther('250000'))).to.be.revertedWith('BUSDPlanet: Exceeds maximum wallet token amount')

        })
      }); 

    describe('Swap:BPT-ETH pool',function () {
        it("should take sell fee", async function(){
          //Transfer 100 from owner to addr4
          await BusdPlanetDeployed.transfer(addr4.address, utils.parseEther('100'))
          expect(await BusdPlanetDeployed.balanceOf(addr4.address)).to.be.equal(utils.parseEther('100'))

          //get ETH bal before swap
          const  BalanceETH = await this.provider.getBalance(addr4.address)/10**18

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


          //calculated expected ETH
          const liquidityBPT = 1000000
          const liquidityETH = 1000
          const pairConstant = liquidityBPT * liquidityETH
          const amount = 44
          const expectedETH = liquidityETH - pairConstant/(liquidityBPT + amount)

          //expect((await this.provider.getBalance(addr4.address)/10**18).toFixed(2)).to.be.equals((expectedETH + BalanceETH).toFixed(2))

          console.log('              Sent BTP Amount:',50)
          console.log('              Expected ETH amount:',expectedETH)
          console.log('              Recieved ETH amount:', await this.provider.getBalance(addr4.address)/10**18 - BalanceETH)


        })

        it("Should take buy fee", async function(){
        
          //connect address 6
          this.routersigner = await this.routersigner.connect(addr4);
          const WETH = await this.routersigner.WETH()
          const path = [WETH, BusdPlanetDeployed.address]

         await this.routersigner.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            path,
            addr4.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
           {value:utils.parseEther('10')}
          )

          //calculated expected Token
          const liquidityBPT = 1000000
          const liquidityETH = 1000
          const pairConstant = liquidityBPT * liquidityETH
          const amount = 10
          const tokens = liquidityBPT - pairConstant/(liquidityETH + amount)

          //deduct 12%
          const expected = tokens * 0.88
          const actual  = await BusdPlanetDeployed.balanceOf(addr4.address)/10**18

         // expect(Math.round(await BusdPlanetDeployed.balanceOf(addr6.address)/10**18)).to.be.equal(Math.round(expected-2))


          console.log('              Sent ETH Amount:',10)
          console.log('              Expected BPT amount:',expected)
          console.log('              Recieved BPT amount:',actual)


        })


     });

     describe('Swap, Liquidify, send fee', function() {


      it('should send fee ', async function () {

        const {0:BPT,1:ETH } =  await this.pairsigner.getReserves()

        reserveA = 1000000
        reserveB = 1000
      

        //Transfer 50,000 tokens from owner to addr4, addr5, addr6
        await BusdPlanetDeployed.transfer(addr4.address, utils.parseEther('20000'))
        await BusdPlanetDeployed.transfer(addr5.address, utils.parseEther('20000'))
        await BusdPlanetDeployed.transfer(addr6.address, utils.parseEther('20000'))
        
        expect(await BusdPlanetDeployed.balanceOf(addr4.address)).to.be.equal(utils.parseEther('20000'))
        expect(await BusdPlanetDeployed.balanceOf(addr5.address)).to.be.equal(utils.parseEther('20000'))
        expect(await BusdPlanetDeployed.balanceOf(addr6.address)).to.be.equal(utils.parseEther('20000'))

      //path
      const wETH = await this.routersigner.WETH()
      const path = [BusdPlanetDeployed.address,wETH]

      //connect user 1 and approve token spending
      await BusdPlanetDeployed.connect(addr4).approve(process.env.ROUTER02, utils.parseEther('20000'))
      //swap
      this.routersigner = await this.routersigner.connect(addr4)
      await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
        utils.parseEther('10000'),
        0,
        path,
        addr4.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
      )

      await amm(10000)

      //confirm fee is collected
      const feeFromAdrr4 = await BusdPlanetDeployed.balanceOf(BusdPlanetDeployed.address)/10**18
      expect(feeFromAdrr4).to.be.equal(1200)
      //console.log('           10000 Tokens gives a fee of:',feeFromAdrr4)
      
      //connect user  2 and approve token spending
      await BusdPlanetDeployed.connect(addr5).approve(process.env.ROUTER02, utils.parseEther('20000'))
      //swap
      this.routersigner = await this.routersigner.connect(addr5)
      await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
        utils.parseEther('5000'),
        0,
        path,
        addr5.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
      )

      await amm(5000)
    
      const feeFromAdrr5 = await BusdPlanetDeployed.balanceOf(BusdPlanetDeployed.address)/10**18
      expect(feeFromAdrr5-feeFromAdrr4).to.be.equal(600)
      //console.log('           5000 Tokens gives a fee of:',feeFromAdrr5 -feeFromAdrr4)

      //get wallent balances before swap and liquidify
      const marketingBalBefore = await this.provider.getBalance(addr1.address)/10**18
      const buyBackBalBefore =  await  this.provider.getBalance(addr2.address)/10**18
      const charityBalBefore = await this.provider.getBalance(addr3.address)/10**18
      const LiquidityBalBefore = await this.provider.getBalance(owner.address)/10**18

        
       //connect user  3 and approve token spending
      await BusdPlanetDeployed.connect(addr6).approve(process.env.ROUTER02, utils.parseEther('20000'))
      //swap
      this.routersigner = this.routersigner.connect(addr6)
      await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
        utils.parseEther('5000'),
        0,
        path,
        addr6.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
        {gasLimit: 30000000}
      )

      await amm(5000)
 
      //get wallet bal after swap
      const marketingBalAfter = await this.provider.getBalance(addr1.address)/10**18
      const buyBackBalAfter=  await  this.provider.getBalance(addr2.address)/10**18
      const charityBalAfter = await this.provider.getBalance(addr3.address)/10**18
      const liquidityBalAfter = await this.provider.getBalance(owner.address)/10**18

        console.log('           ')
        console.log('           BPT Reserve:',BPT/10**18)
        console.log('           ETH Reserve:',ETH/10**18)
        console.log('           ')

      async function amm(amountA) {

        rA = reserveA
        rB = reserveB

        const pairConstant = rA * rB
        
        reserveA = rA + amountA
        reserveB = pairConstant/reserveA

        const expectedB = rB -reserveB

        return expectedB 

      }

      // Eth collected
      console.log('           Marketing ETH Estimate:',await amm(400))
      console.log('           Marketing ETH Actual:',marketingBalAfter - marketingBalBefore)
      console.log('           ')

      
      console.log('           Buyback ETH Estimate:',await amm(200))
      console.log('           Buyback ETH Actual',buyBackBalAfter -buyBackBalBefore)
      console.log('           ')
      
      
      console.log('           Charity ETH Estimate:',await amm(200))
      console.log('           Charity ETH Actual:',charityBalAfter - charityBalBefore)
      console.log('           ')
      
     })

     }); 

     describe('Update',function(){

      it('Should update buy fees and sell fees',async function() {

        await BusdPlanetDeployed.updateBuyFees(1000, 400,400, 200, 200);
        await BusdPlanetDeployed.updateSellFees(2000, 300, 500, 200, 1000)

           expect(await BusdPlanetDeployed.buyFeesCollected()).to.be.equal(0)
           expect(await BusdPlanetDeployed.buyDividendFee()).to.be.equal(1000)
           expect(await BusdPlanetDeployed.buyLiquidityFee()).to.be.equal(400)
           expect(await BusdPlanetDeployed.buyMarketingFee()).to.be.equal(400)
           expect(await BusdPlanetDeployed.buyBuybackFee()).to.be.equal(200)
           expect(await BusdPlanetDeployed.buyCharityFee()).to.be.equal(200)
           expect(await BusdPlanetDeployed.buyTotalFees()).to.be.equal(2200)  
           
           expect(await BusdPlanetDeployed.sellFeesCollected()).to.be.equal(0)
           expect(await BusdPlanetDeployed.sellDividendFee()).to.be.equal(2000)
           expect(await BusdPlanetDeployed.sellLiquidityFee()).to.be.equal(300)
           expect(await BusdPlanetDeployed.sellMarketingFee()).to.be.equal(500)
           expect(await BusdPlanetDeployed.sellBuybackFee()).to.be.equal(200)
           expect(await BusdPlanetDeployed.sellCharityFee()).to.be.equal(1000)
           expect(await BusdPlanetDeployed.sellTotalFees()).to.be.equal(4000)

      } )

      it('Should update Minmum Token Balance', async function(){
           await BusdPlanetDeployed.updateMinTokenBalance(100000)
           expect(await BUSDPlanetDividendTrackerDeployed.minimumTokenBalanceForDividends()).to.be.equal(utils.parseEther('100000'))
      })
      it('Should update Minmum SwapAndLiquidify Amount', async function(){
        await BusdPlanetDeployed.updateSwapTokensAtAmount(utils.parseEther('1000'))
        expect(await BusdPlanetDeployed.swapTokensAtAmount()).to.be.equal(utils.parseEther('1000'))

      })

      it('Should update Wallet address',async function(){
       await  expect(BusdPlanetDeployed.updateMarketingWallet(addr1.address)).to.revertedWith('BUSDPlanet: The marketing wallet is already this address')
       await  expect(BusdPlanetDeployed.updateLiquidityWallet(owner.address)).to.revertedWith('BUSDPlanet: The liquidity wallet is already this address')
       await  expect(BusdPlanetDeployed.updateBuyBackWallet(addr2.address)).to.revertedWith('BUSDPlanet: The buyback wallet is already this address')
       await  expect(BusdPlanetDeployed.updateCharityWallet(addr3.address)).to.revertedWith('BUSDPlanet: The charity wallet is already this address')

       await  BusdPlanetDeployed.updateMarketingWallet(addr4.address)
       await  BusdPlanetDeployed.updateLiquidityWallet(addr5.address)
       await  BusdPlanetDeployed.updateBuyBackWallet(addr6.address)
       await  BusdPlanetDeployed.updateCharityWallet(addr7.address)
       await  expect(BusdPlanetDeployed.updateCharityWallet(owner.address)).to.revertedWith("BUSDPlanet: Account is already the value of 'excluded'")
      })

     })
  })
