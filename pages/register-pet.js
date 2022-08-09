import React, { useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";
import { create } from "ipfs-http-client";

const client = create({ url: "https://ipfs.infura.io:5001/api/v0" });

const registerPet = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({
    name: "",
    age: "",
    type: "",
    breed: "",
    description: "",
  });

  const router = useRouter();

  const onChange = async (e) => {
    const file = e.target.files[0];
    try {
      const addedFile = await client.add(file, {
        progress: (prog) => console.log(`receiving ... ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${addedFile.path}`;
      console.log(url);
      setFileUrl(url);
    } catch (error) {
      console.log(error);
    }
  };

  const uploadToIPFS = async () => {
    const { name, age, description } = formInput;

    if (!name || !description || !age || !fileUrl) return;

    // upload metadata to IPFS first
    const data = JSON.stringify({
      name,
      age,
      description,
      image: fileUrl,
    });

    try {
      const addedFile = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${addedFile.path}`;
      return url;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  };

  const register = async () => {
    const url = await uploadToIPFS();

    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let contract = new ethers.Contract(contractAddress, abi, signer);
    let create_tx = contract.createPet()
    await create_tx.wait();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="mt-8 border rounded p-4"
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          className="mt-8 border rounded p-4"
        />
        {/* Checkbox for Type of pet */}
        {/* Breed - have 4 options for dog and 3 options for cats and none for other */}

        {/* Image */}
        <input type="file" name="Asset" className="my-4" onChange={onChange} />
        {fileUrl && (
          <img src={fileUrl} width="350px" className="rounded mt-4 mx-auto" />
        )}

        {/* Description  */}
        <textarea
          name="Description"
          placeholder="Description"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            setFormInput({ ...formInput, description: e.target.value })
          }
        ></textarea>

        {/* Register button */}
        <button onClick={register}>Register Pet</button>
      </div>
    </div>
  );
};

export default registerPet;