declare let window: any;
import { createContext, useContext, useEffect, useState } from 'react'
import Web3 from 'web3';
import DonationContract from "../abis/DonationContract.json";

interface DataContextProps {
    account: string;
    contract: any;
    loading: boolean;
    images: any[];
    imageCount: number;
    updateImages: () => Promise<void>;
    donateImageOwner: (id: string, donateAmount: any) => Promise<void>;
}

const DataContext = createContext<DataContextProps | null>(null);

export const DataProvider: React.FC = ({ children }) => {
    const data = useProviderData();
    return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};

export const useData = () => useContext<DataContextProps | null>(DataContext);

export const useProviderData = () => {
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState<any[]>([]);
    const [imageCount, setImageCount] = useState(0);
    const [account, setAccount] = useState("0x0");
    const [contract, setContract] = useState<any>();

    useEffect(() => {
        loadWeb3();
        loadBlockchainData();
    }, []);

    const loadWeb3 = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            window.ethereum.request({ method: 'eth_requestAccounts', [] })
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert(
                "No compatible wallet detected. Please install the Metamask browser extension to continue."
            );
        }
    };

    const loadBlockchainData = async () => {
        const web3 = window.web3;
        var allAccounts = await web3.eth.getAccounts();
        setAccount(allAccounts[0]);
        const networkData = DonationContract.networks["5777"];
        if (networkData) {
            var tempContract = new web3.eth.Contract(
                DonationContract.abi,
                networkData.address
            );
            setContract(tempContract);
            var count = await tempContract.methods.imageCount().call();
            setImageCount(count);
            var tempImageList = [];
            for (var i = 1; i <= count; i++) {
                const image = await tempContract.methods.images(i).call();
                tempImageList.push(image);
            }
            tempImageList.reverse();
            setImages(tempImageList);
        } else {
            window.alert("TestNet not found");
        }
        setLoading(false);
    };

    const updateImages = async () => {
        setLoading(true);
        if (contract !== undefined) {
          var count = await contract.methods.imageCount().call();
          setImageCount(count);
          var tempImageList = [];
          for (var i = 1; i <= count; i++) {
            const image = await contract.methods.images(i).call();
            tempImageList.push(image);
          }
          tempImageList.reverse();
          setImages(tempImageList);
        }
        setLoading(false);
      };
      
      const donateImageOwner = async (id: string, donateAmout: any) => {
        await contract.methods
          .donateImageOwner(id)
          .send({ from: account, value: donateAmout });
      };
      
      return {
        account,
        contract,
        loading,
        images,
        imageCount,
        updateImages,
        donateImageOwner,
      };
};