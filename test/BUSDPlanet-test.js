
const { expect } = require("chai");
const { ethers } = require("hardhat");

  let BusdPlanet;
  let BusdPlanetDeployed;
  let BUSDPlanetDividendTracker
  let BUSDPlanetDividendTrackerDeployed
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addr6;
  let initialLiquidty;
  let supply;
  
  describe("BusdPlanet", function () {

    beforeEach(async function () {

      [owner, addr1, addr2, addr3, addr4,addr5,addr6,...addrs] = await ethers.getSigners();
      
      //get contract factory
      BusdPlanet =  await ethers.getContractFactory("BusdPlanet");
      BUSDPlanetDividendTracker = await hre.ethers.getContractFactory("BusdPlanetDividendTracker");
      
      //deploy BusdPlanet
      BusdPlanetDeployed = await BusdPlanet.deploy(process.env.ROUTER02, process.env.BEP20ROP,addr1.address,addr2.address,addr3.address);
      BusdPlanetDeployed.deployed()

      //deploy BUSDPlanetDividendTracker
      BUSDPlanetDividendTrackerDeployed = await BUSDPlanetDividendTracker.deploy(process.env.BEP20ROP, process.env.BUSDPLANETROP)
      await BUSDPlanetDividendTrackerDeployed.deployed()

        
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
      ['function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)', 'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)', 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', 'function swapExactTokensForETHSupportingFeeOnTransferTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external','function removeLiquidityETHSupportingFeeOnTransferTokens( address token,uint liquidity,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external returns (uint amountETH)'], 
      this.provider);
      this.routersigner = this.router02.connect(owner)

      //Enable transfer
      await BusdPlanetDeployed.setTransfersEnabled(true)

      //set devidend tracker
                         
      await  BusdPlanetDeployed.initializeDividendTracker(BUSDPlanetDividendTrackerDeployed.address)

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

        it("Should assign the total supply - initialLiquidty tokens to the owner", async function () {
          const ownerBalance = await BusdPlanetDeployed.balanceOf(owner.address);

          expect(ethers.utils.parseEther('9990000')).to.equal(ownerBalance);
        });

      });

  /** 
    describe("Transfers:Before swapAndLiquify is enabled", function () {

      it("Should transfer with no fee for excluded accounts ", async function () {
        // Transfer 50 tokens from owner to addr1

        //await BusdPlanetDeployed.excludeFromFee(owner.address)
        await BusdPlanetDeployed.excludeFromFee(addr1.address)
        await BusdPlanetDeployed.excludeFromFee(addr2.address)
        const amount =ethers.utils.parseEther('50')
        

        await BusdPlanetDeployed.transfer(addr1.address,amount );
        const addr1Balance = await BusdPlanetDeployed.balanceOf(addr1.address);
        expect(addr1Balance).to.equal( amount);

        // Transfer 50 tokens from addr1 to addr2
        // We use .connect(signer) to send a transaction from another account
        await BusdPlanetDeployed.connect(addr1).transfer(addr2.address, amount);
        const addr2Balance = await BusdPlanetDeployed.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(amount);

        //Treansfer back to owner  
        await BusdPlanetDeployed.connect(addr2).transfer(owner.address, amount);
        const ownerBalance = await BusdPlanetDeployed.balanceOf(owner.address);
        expect(ownerBalance/10**18).to.equal(990000000);

      });

      it("Should transfer with fee for included accounts ", async function () {

        //check reflection supply && true supply
        supply = await BusdPlanetDeployed._getCurrentSupply()
        const {0: rsupply, 1: tsupply} = supply
        const rate = await BusdPlanetDeployed._getRate()
        expect(rsupply > tsupply)
    

        // Transfer'50' tokens from owner to addr3 (expect balance of addr3 to be equal to'50')
        await BusdPlanetDeployed.transfer(addr3.address, ethers.utils.parseEther('50'));
        const addr3Balance = await BusdPlanetDeployed.balanceOf(addr3.address);
        expect(addr3Balance ).to.equal(ethers.utils.parseEther('50'));

        //Transfer'50' tokens from addr3 to addr4 (expect a fee of 10%)
        //We use .connect(signer) to send a transaction from another account
        await BusdPlanetDeployed.connect(addr3).transfer(addr4.address, ethers.utils.parseEther('50'));
        const addr3Balance2 = await BusdPlanetDeployed.balanceOf(addr3.address)
        const addr4Balance = await BusdPlanetDeployed.balanceOf(addr4.address);
        const reflect = (addr4Balance - ethers.utils.parseEther('45'))/ethers.utils.parseEther('45')
        expect(0).to.be.equal(addr3Balance2)
        expect(true).to.be.equals(reflect > 0 && reflect < 2 )

        //Transfer 30 tokens from addr4 to addr5 (expect a fee of 10%)
        await BusdPlanetDeployed.connect(addr4).transfer(addr5.address, ethers.utils.parseEther('30'));
        const addr4Balance2 = await BusdPlanetDeployed.balanceOf(addr4.address);
        const addr5Balance = await BusdPlanetDeployed.balanceOf(addr5.address);
        const reflection2 = (addr5Balance - ethers.utils.parseEther('27'))/ethers.utils.parseEther('27')

        expect(true).to.be.equal(ethers.utils.parseEther('15') < addr4Balance2 && addr4Balance2 < ethers.utils.parseEther('16'));
        expect(true).to.be.equal(reflection2 > 0 && reflection2 < 2)

        //Transfer 20 tokens from addr5 to addr6 (expect a fee of 10%)
        await BusdPlanetDeployed.connect(addr5).transfer(addr6.address, ethers.utils.parseEther('20'));
        const addr5Balance2 = await BusdPlanetDeployed.balanceOf(addr5.address);
        const addr6Balance = await BusdPlanetDeployed.balanceOf(addr6.address);
        const reflection3 = (addr6Balance - ethers.utils.parseEther('27'))/ethers.utils.parseEther('27')

        expect(true).to.equal(ethers.utils.parseEther('7') < addr5Balance2 && addr5Balance2 < ethers.utils.parseEther('8'));
        expect(true).to.equal(0 > reflection3 && reflection3 < 3)
        
      });

      it('Should not send fee to Charity and marketing wallet', async function () {
      
        //get Charitywallet and MarketingWallet balance before transfer
        const charityWalletBefore = await BusdPlanetDeployed.balanceOf(addr1.address)
        const MarketingWalletBefore = await BusdPlanetDeployed.balanceOf(addr2.address)

        //Transfer from owner to  addr3 to addr4 (expect charges of 0%)
        await BusdPlanetDeployed.transfer(addr3.address, 150)
        await BusdPlanetDeployed.connect(addr3).transfer(addr4.address,100)

        //get Charitywallet and MarketingWallet balance after transfer
        const charityWalletAfter = await BusdPlanetDeployed.balanceOf(addr1.address)
        const MarketingWalletAfter = await BusdPlanetDeployed.balanceOf(addr2.address)
        
        const  marketingDiff= MarketingWalletAfter - MarketingWalletBefore
        const  charityDiff= charityWalletAfter - charityWalletBefore
        
        expect(marketingDiff).to.be.equal(0)
        expect(charityDiff).to.be.equal(0)

      })

      it('should send fee to burn wallent', async function () {

       const burnBalanceBefore = await BusdPlanetDeployed.balanceOf('0x000000000000000000000000000000000000dEaD')

       // Transfer'200' tokens from owner to addr3 (expect balance of addr3 to be equal to'200')
       await BusdPlanetDeployed.transfer(addr3.address, ethers.utils.parseEther('200'));
       const addr3Balance = await BusdPlanetDeployed.balanceOf(addr3.address);
       expect(addr3Balance ).to.equal(ethers.utils.parseEther('200'));
       expect(burnBalanceBefore).to.be.equal(0)

       //Transfer'200' tokens from addr3 to addr4 (expect 1% (2) is sent to burn wallent)
       await BusdPlanetDeployed.connect(addr3).transfer(addr4.address, ethers.utils.parseEther('200'));
       const burnBalanceAfter = await BusdPlanetDeployed.balanceOf('0x000000000000000000000000000000000000dEaD')

       
       expect(true).to.be.equal(burnBalanceAfter > ethers.utils.parseEther('2') && burnBalanceAfter < ethers.utils.parseEther('3') )

        

      })
    
    });
    
   
    describe('Transfers:After swapAndLiquify is enabled', function(){

      

      it("Should transfer with no fee for excluded accounts ", async function () {

        
        
        // Transfer 50,000,000 tokens from owner to addr1
        await BusdPlanetDeployed.excludeFromFee(addr1.address)
        await BusdPlanetDeployed.excludeFromFee(addr2.address)
        const amount =ethers.utils.parseEther('50000000') 

        await BusdPlanetDeployed.transfer(addr1.address,amount );
        const addr1Balance = await BusdPlanetDeployed.balanceOf(addr1.address);
        expect(addr1Balance).to.equal( amount);

        // Transfer 50 tokens from addr1 to addr2
        // We use .connect(signer) to send a transaction from another account
        await BusdPlanetDeployed.connect(addr1).transfer(addr2.address, amount);
        const addr2Balance = await BusdPlanetDeployed.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(amount);

        //Treansfer back to owner  
        await BusdPlanetDeployed.connect(addr2).transfer(owner.address, amount);
        const ownerBalance = await BusdPlanetDeployed.balanceOf(owner.address);

        //expect balance to be equal  to totalsupply sub initialLiquidty
        expect(ethers.utils.parseEther('990000000')).to.equal(ownerBalance);

      });

      it("Should transfer with fee for included accounts ", async function () {

        //check reflection supply && true supply
        supply = await BusdPlanetDeployed._getCurrentSupply()
        const {0: rsupply, 1: tsupply} = supply
        expect(rsupply > tsupply)

      

        // Transfer'50,000,000' tokens from owner to addr3 (expect balance of addr3 to be equal to'50,000,000')
        await BusdPlanetDeployed.transfer(addr3.address, ethers.utils.parseEther('50000000'));
        const addr3Balance = await BusdPlanetDeployed.balanceOf(addr3.address);
        expect(addr3Balance ).to.equal(ethers.utils.parseEther('50000000'));

        //Transfer'50,000,000' tokens from addr3 to addr4 (expect a fee of 10%)
        await BusdPlanetDeployed.connect(addr3).transfer(addr4.address, ethers.utils.parseEther('50000000'));
        const addr3Balance2 = await BusdPlanetDeployed.balanceOf(addr3.address)
        const addr4Balance = await BusdPlanetDeployed.balanceOf(addr4.address);
        const reflect = (addr4Balance - ethers.utils.parseEther('45000000'))/ethers.utils.parseEther('5000000')

        expect(0).to.be.equal(addr3Balance2)
        expect(true).to.be.equals(reflect > 0 && reflect < 3 )
        expect(45).to.be.equal(Math.round(addr4Balance/10**24))


        //Transfer 30,000,000 tokens from addr4 to addr5 (expect a fee of 10%)
        await BusdPlanetDeployed.connect(addr4).transfer(addr5.address, ethers.utils.parseEther('30000000'));
        const addr4Balance2 = await BusdPlanetDeployed.balanceOf(addr4.address);
        const addr5Balance = await BusdPlanetDeployed.balanceOf(addr5.address);
        const reflection2 = (addr5Balance - ethers.utils.parseEther('27000000'))/ethers.utils.parseEther('30000000')

        expect(true).to.be.equal(ethers.utils.parseEther('15000000') < addr4Balance2 && addr4Balance2 < ethers.utils.parseEther('16000000'));
        expect(true).to.be.equal(reflection2 > 0 && reflection2 < 3)
        expect(27).to.be.equal(Math.round(addr5Balance/10**24))

        //Transfer 20,000,000 tokens from addr5 to addr6 (expect a fee of 10%)
        await BusdPlanetDeployed.connect(addr5).transfer(addr6.address, ethers.utils.parseEther('20000000'));
        const addr5Balance2 = await BusdPlanetDeployed.balanceOf(addr5.address);
        const addr6Balance = await BusdPlanetDeployed.balanceOf(addr6.address);
        const reflection3 = (addr6Balance - ethers.utils.parseEther('18000000'))/ethers.utils.parseEther('20000000')

        expect(true).to.equal(ethers.utils.parseEther('7000000') < addr5Balance2 && addr5Balance2 < ethers.utils.parseEther('8000000'));
        expect(true).to.equal(0 < reflection3 && reflection3 < 3)
        expect(18).to.be.equal(Math.round(addr6Balance/10**24))

      });

      it('Should send fee to Charity and marketing wallet', async function () {


        
        //get Charitywallet,MarketingWallet and this contract balances  before transfer
        const charityBalanceBefore = await this.provider.getBalance(addr1.address)
        const marketingBalanceBefore = await this.provider.getBalance(addr2.address)
        const tokenContractBalanceBefore = await this.provider.getBalance(BusdPlanetDeployed.address)
        expect(true).to.be.equal(charityBalanceBefore < marketingBalanceBefore && tokenContractBalanceBefore < marketingBalanceBefore)
       

        // Transfer'50,000,000' tokens from owner to addr3 
        await BusdPlanetDeployed.transfer(addr3.address, ethers.utils.parseEther('50000000')); 
        //Transfer'50,000,000' tokens from addr3 to addr4 (unlock swap and Liquidfy)
        await BusdPlanetDeployed.connect(addr3).transfer(addr4.address, ethers.utils.parseEther('50000000'));
        //Transfer 30,000,000 tokens from addr4 to addr5 (trigger swap and Liquidfy)
        await BusdPlanetDeployed.connect(addr4).transfer(addr5.address, ethers.utils.parseEther('30000000'));

      
         //get Charitywallet, MarketingWallet and Tokencontract balance after swap and liquidfy
         const charityBalanceAfter = await this.provider.getBalance(addr1.address)
         const marketingBalanceAfter = await this.provider.getBalance(addr2.address)
         const tokenContractBalanceAfter = await this.provider.getBalance(BusdPlanetDeployed.address)
        
         const  marketingDiff= (marketingBalanceAfter - marketingBalanceBefore)/10**18
         const  charityDiff= (charityBalanceAfter - charityBalanceBefore)/10**18
         const tokenDiff= (tokenContractBalanceAfter - tokenContractBalanceBefore)/10**18
        
          expect(8).to.be.equal(Math.round(marketingDiff))
          expect(2).to.be.equal(Math.round(charityDiff))
          expect(0).to.be.equal(tokenDiff)

      });
    
    });
  
    describe("Liquidity", function () {


      it("Should add right amount of liquidty", async function(){

        

            const Ownerliquidity = await this.pairsigner.balanceOf(owner.address)
            const totalLiquidity = await this.pairsigner.totalSupply()
            const decimals = await this.pairsigner.decimals()

            const reserves = await this.pairsigner.getReserves()
            const {0: reserve0, 1:reserve1, 3: blockTimestampLast} = reserves
            const ETH = reserve0/10**18
            const GIVERS = reserve1/10**18

            const MINIMUM_LIQUIDITY = 10**3;
            const lpTokenAmount = (Math.sqrt( ETH* GIVERS));
            

            expect(true).to.be.equal(ETH ===200|| ETH === 10000000)
            expect(true).to.be.equal(GIVERS === 10000000 || GIVERS ===200)
            expect(decimals).to.be.equal(18)
            
            expect(totalLiquidity/10**decimals).to.be.equal(Ownerliquidity/10**decimals)
            expect(lpTokenAmount).to.be.equals(Ownerliquidity/10**decimals)
      }); 

      it("Should remove half Liquidity", async function() {

          const GIVERS = 10000000;
          const ETH = 200;
          const lp = (Math.sqrt(GIVERS * ETH))*10**18;
          const half = (lp/2)
          var otherhalf = lp - half

         
          await this.pairsigner.approve(process.env.ROUTER02, BigInt(half));
          await this.routersigner.removeLiquidityETHSupportingFeeOnTransferTokens(
            BusdPlanetDeployed.address,
            BigInt(half),
            0,
            0,
            owner.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
            ) 

         var ownerBal = await this.pairsigner.balanceOf(owner.address);
         otherhalf = otherhalf/10**18
         ownerBal = ownerBal/10**18

          expect(ownerBal.toFixed(5)).to.be.equal(otherhalf.toFixed(5))

      });

    }); */

  })
