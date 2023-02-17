import Head from 'next/head'
import styles from '../styles/Home.module.css'
import abi from '../utils/WaveContract.json';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState();
  //状态变量，存储前端发来的数据
  const [allWaves, setAllWaves] = useState([]);

  //合约地址
  const contractAddress = "0xBBb8A4642a335388a5390de5c25EDBbA801346fD";
  //ABI文件，相当于合约的接口声明
  const contractABI = abi.abi;

  /*
   * 查询合约里的wave数据
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;  //如果安装了metamask插件，那么会向window注入ethereum对象

      if (ethereum) {
        /*
          ethers.js用法
          provider是连接链的抽象，signer是钱包账户的抽象
        */
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        //前端合约对象
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves(); //调用智能合约的getAllWaves()方法

        let wavesCleaned = [];
        waves.forEach(
          wave => {
            wavesCleaned.push({
              address: wave.waver,
              timestamp: new Date(wave.timestamp * 1000),
              message: wave.message
            });
          }
        );

        /*
         * 把查询回来的数据存储到前端的allWaves对象里
         */
        setAllWaves(wavesCleaned);

      } else {
        console.log("没有ethereum对象！");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * 
  */
  const checkIfWalletIsConnected = async () => {

    try {
      /*
      * 是否有接入window.ethereum；是否安装了钱包
      */
      const { ethereum } = window;

      if (!ethereum) {
        console.log("请确认您已经安装了MetaMask插件");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * 用户是否授权
        尝试去获取本地钱包账户列表
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0]; //取本地钱包第一个账户
        console.log("Found an authorized account:", account);
        setCurrentAccount(account); //把当前账户存到前端currentAccount对象
        getAllWaves();
      } else {
        console.log("用户未授权")
      }
    } catch (error) {
      console.log(error);
    }

  }


  /**
  * 连接钱包
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      //请求获取本地钱包地址
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); //钱包地址存放到前端对象
    } catch (error) {
      console.log(error)
    }
  }

  /**
  * 向智能合约发送wave数据
  */
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum && currentAccount) {

        //ethers.js三连~
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
        * 调用合约wave(message)方法，发送数据
        */
        let waveMessage = document.getElementById("waveMsg");
        const waveTxn = await wavePortalContract.wave(waveMessage.value, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait(); //等待调用wave()方法这个交易执行完毕
        console.log("Mined -- ", waveTxn.hash);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /**
  * 调用合约getTotalWaves()方法，前端计数展示合约里多少个Wave
  */
  const totalWaves = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        let total = document.getElementById('totalWaves');
        total.innerHTML = "Total Waves : " + count;
      }
    } catch (error) {
      console.log(error)
    }
  }

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    totalWaves()
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]); 

    totalWaves();
  };

  /*
  * 页面载入时执行
  */
  useEffect(() => {
    checkIfWalletIsConnected(); //检查钱包是否连接
    totalWaves(); //展示计数wave数

    /**
      emit NewWave事件处理回调函数
    */
    let wavePortalContract;
    //收到事件以后重新渲染 

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();


      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave); //绑定合约的NewWave事件
    }
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave); //解除事件绑定
      }
    };

  }, [])
  return (
    <>
      <Head>
        <title>HyaCinth's Test Faucet</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <span className={styles.alchemyFaucetbackground1} />
        <span className={styles.alchemyFaucetbackground2} />
        <div className={styles.mainContainer}>
          <div className={styles.dataContainer}>
            <div className={styles.header}>
              👋 Hi there!
            </div>

            <div className={styles.bio}>
              我是 HyaCinth.
              <br></br>
              连接你的以太坊钱包并领取ETH吧!
            </div>
            <input id="waveMsg" type="text" className={styles.input} placeholder='Enter Your Wallet Address (0x...) or ENS Domain'></input>
            <button className={styles.WaveButton} onClick={wave}>
              Send Me ETH
            </button>
            {/*
       * If there is no currentAccount render this button
       */}
            {!currentAccount && (
              <button className="waveButton" onClick={connectWallet}>
                {/* <img src="src/metamask.ico" height="25" width="25"></img> */}
                连接钱包
              </button>
            )}
          </div>
          {allWaves.length > 0 &&
            <button id="totalWaves" className={styles.totalWaves}>
              {allWaves.map((wave, index) => {
                return (
                  <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                    <div>合约地址: {wave.address}</div>
                    <div>时间: {wave.timestamp.toString()}</div>
                    <div>合约信息: {wave.message}</div>
                  </div>)
              })}
            </button>}
        </div>
      </main>
    </>
  )
}
