import { useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";
import { create } from "ipfs-http-client";
import CryptoPets from "../utils/CryptoPets.json";

const client = create({ url: "https://ipfs.infura.io:5001/api/v0" });

const CONTRACT_ADDRESS = "0xf839db645E008816B141E9C9649b939Ed8C5FB48";

const registerPet = () => {
  const [breedList, setBreedList] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({
    name: "",
    age: "",
    type: "",
    breed: "",
    description: "",
    isLost: false,
    isAvailableForAdoption: false,
  });

  const typeOfPet = [
    {
      name: "dog",
      breeds: ["Pug", "Shiba Inu", "St. Bernard", "Lab"],
    },
    {
      name: "cat",
      breeds: ["type1", "type2", "type3"],
    },
    {
      name: "other",
      breeds: [],
    },
  ];

  const router = useRouter();

  const onChange = async (e) => {
    const file = e.target.files[0];
    try {
      const addedFile = await client.add(file, {
        progress: (prog) => console.log(`receiving ... ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${addedFile.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log(error);
    }
  };

  const uploadToIPFS = async () => {
    const { name, age, description, type, breed } = formInput;

    if (!name || !description || !age || !type || !breed || !fileUrl) {
      console.log("Missing a field");
      return;
    }

    // upload metadata to IPFS first
    const data = JSON.stringify({
      name,
      age,
      type,
      breed,
      description,
      image: fileUrl,
    });

    console.log(data);

    try {
      const addedFile = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${addedFile.path}`;
      return url;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  };

  const register = async () => {
    const { isLost, isAvailableForAdoption } = formInput;
    const url = await uploadToIPFS();
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CryptoPets.abi,
      signer
    );
    let create_tx = await contract.createPet(
      url,
      isLost,
      isAvailableForAdoption
    );
    await create_tx.wait();

    router.push("/my-pets");
  };

  const onSelectType = (e) => {
    console.log(e.target.value);
    setFormInput({ ...formInput, type: e.target.value });
    console.log(
      typeOfPet.filter((pet) => pet.name === e.target.value)[0].breeds
    );
    const newList = e.target?.value
      ? typeOfPet.filter((pet) => pet.name === e.target.value)[0].breeds
      : [];

    setBreedList(newList);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="mt-8 border rounded p-4"
          onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          className="mt-8 border rounded p-4"
          onChange={(e) => setFormInput({ ...formInput, age: e.target.value })}
        />

        {/* Checkbox for Type of pet */}

        <h3 className="text-xl font bold">Type of Pet</h3>

        <select
          className="mt-8 border rounded p-4"
          name="type"
          onChange={onSelectType}
        >
          <option selected disabled>
            Please select a type
          </option>
          ;
          {typeOfPet.map((type) => (
            <option key={type.name} value={type.name}>
              {type.name}
            </option>
          ))}
        </select>

        <h3 className="text-xl font bold">Breed</h3>

        <select
          className="mt-8 border rounded p-4"
          name="breed"
          onChange={(e) =>
            setFormInput({ ...formInput, breed: e.target.value })
          }
        >
          ;
          {breedList.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>

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
        <button className="py-4 my-4 text-white bg-blue-500" onClick={register}>
          Register Pet
        </button>
      </div>
    </div>
  );
};

export default registerPet;
