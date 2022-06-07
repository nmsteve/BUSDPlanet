// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const BEP20Token= await hre.ethers.getContractFactory("BEP20Token");
  const BUSDPlanet =  await hre.ethers.getContractFactory("BusdPlanet");
  const BUSDPlanetDividendTracker = await hre.ethers.getContractFactory("BusdPlanetDividendTracker");


   [owner, addr1, addr2, addr3 ] = await ethers.getSigners();

  //  //deploy BEP20
  //  const BEP20Deployed = await BEP20Token.deploy();
  //  await BEP20Deployed.deployed();
  //  console.log("BEP20 deployed to:", BEP20Deployed.address);

  // //deploy BUSDPlanet
  //  const BUSDPlanetDeployed = await  BUSDPlanet.deploy(process.env.ROUTER02RSC, BEP20Deployed.address, addr1.address, addr2.address, addr3.address)
  //  await BUSDPlanetDeployed.deployed()
  // console.log("BUSDPlanet deployed to:", BUSDPlanetDeployed.address);


  //deploy BUSDPlanetDividendTracker
  const BUSDPlanetDividendTrackerDeployed = await BUSDPlanetDividendTracker.deploy(process.env.BEP20ROP, process.env.BUSDPLANETROP)
  await BUSDPlanetDividendTrackerDeployed.deployed()
  console.log("BUSDPlanetDividendTracker deployed to:", BUSDPlanetDividendTrackerDeployed.address)
  

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
