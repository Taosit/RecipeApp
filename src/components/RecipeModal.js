import React, {useEffect, useRef, useState} from "react"
import {useRecipeContext} from "../contexts/RecipeContextProvider";
import {v4 as uuid} from "uuid"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {doc, setDoc, updateDoc, arrayUnion} from "firebase/firestore";
import {storage, db} from "../firebase.config";
import NameField from "./createRecipe/NameField";
import IngredientsField from "./createRecipe/IngredientsField";
import StepsField from "./createRecipe/StepsFields";
import ImageField from "./createRecipe/ImageField";
import TagsField from "./createRecipe/TagsFields";
import {onAuthStateChanged, getAuth} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";

function RecipeModal({showModal, setShowModal}) {
  const emptyRecipe = {name: "", tags: [], ingredientStr: "", ingredients: [], date: null, likes: 0, seasonings: "", steps: [""]};
  const [newRecipe, setNewRecipe] = useState(emptyRecipe)
  const {setRecipes} = useRecipeContext()
  const [step, setStep] = useState(0)

  const prevBtnRef = useRef()
  const nextBtnRef = useRef()

  const isMounted = useRef(true)
  const navigate = useNavigate()
  const auth = getAuth()

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setNewRecipe({ ...newRecipe, userRef: user.uid })
        }
      })
    }

    return () => {
      isMounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted])

  const handleChange = (inputValue, field) => {
    setNewRecipe(prevRecipe => ({
      ...prevRecipe,
      [field]: inputValue
    }))
  }

  const addRecipeRefToUser = async (id) => {
    if (!auth.currentUser) return
    const userRef = doc(db, "users", auth.currentUser.uid)
    await updateDoc(userRef, {
      createdRecipes: arrayUnion(id)
    })
  }

  const getImageUrl = async (img) => {
    const id = uuid();
    const imgRef = ref(storage, `images/${id}`);
    await uploadBytes(imgRef, img);
    return await getDownloadURL(imgRef);
  }

  const getIngredients = (ingredientStr) => {
    let ingredients = ingredientStr.split(",");
    ingredients = ingredients.map(ingredient => ingredient.trim());
    let results = [];
    ingredients.forEach(ingredient => {
      results = results.concat(ingredient.split("and"))
    });
    const resultsWithUnits = results.map(result => result.trim().toLowerCase())
    return resultsWithUnits.map(result => {
      if (result.split("a ")[0] === "") return result.slice(2);
      if (result.split("an ")[0] === "") return result.slice(3);
      if (result.split(" of ").length === 2) return result.split(" of ")[1];
      if (!isNaN(parseInt(result.split(" ")[0]))) return result.split(" ").slice(1).join(" ");
      return result
    })
  }

  const createRecipe = async (e) => {
    e.preventDefault()
    prevBtnRef.current.disabled = true;
    nextBtnRef.current.disabled = true
    console.log(newRecipe)
    if (newRecipe.name === "" || newRecipe.ingredients === "" || newRecipe.seasonings === "" ||
      newRecipe.steps[0] === "" || !newRecipe.image) return

    const finalImage = await getImageUrl(newRecipe.image);

    const validSteps = newRecipe.steps.filter(step => step.instruction && step.instruction.length !== 0);

    const stepsWithImagesPromise = validSteps.map(async step =>{
      if (!step.image) return step
      const url = await getImageUrl(step.image);
      return {...step, image: url}
    })

    Promise.all(stepsWithImagesPromise)
      .then(async stepsWithImages => {
        const recipeId = uuid()
        const finalRecipe = {...newRecipe, steps: stepsWithImages, name: newRecipe.name.toLowerCase().trim(),
          ingredientStr: newRecipe.ingredients, ingredients: getIngredients(newRecipe.ingredients),
          image: finalImage, id: recipeId, date: new Date(),}
        console.log(finalRecipe)
        setRecipes(prev => [...prev, finalRecipe])
        await setDoc(doc(db, "recipes", recipeId), finalRecipe)
        await addRecipeRefToUser(recipeId)
        toast.success("Successfully added a new recipe")
      })
    closeModal()
  }

  const closeModal = () => {
    setStep(0)
    setShowModal(false)
    setNewRecipe(emptyRecipe)
  }

  const showField = () => {
    switch (step) {
      case 0:
        return <NameField recipe={newRecipe} handleChange={handleChange}/>
      case 1:
        return <TagsField handleChange={handleChange}/>
      case 2:
        return <IngredientsField recipe={newRecipe} handleChange={handleChange}/>
      case 3:
        return <StepsField recipe={newRecipe} setRecipe={setNewRecipe}/>
      case 4:
        return <ImageField recipe={newRecipe} handleChange={handleChange}/>
    }
  }

  const prevStep = (e) => {
    e.preventDefault()
    setStep(prev => prev - 1)
  }

  const nextStep = (e) => {
    e.preventDefault()
    if (step === 4) createRecipe(e)
    else setStep(prev => prev + 1)
  }

  return (
    <>
      <div className="overlay" hidden={!showModal}>
      <div className="recipe-modal" hidden={!showModal}>
        <span className="close-modal" onClick={closeModal}>x</span>
        <form className="recipe-form">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{width: `${step * 20 + 20}%`}}></div>
          </div>
          <div className="input-container">
            {showField()}
          </div>
          <div className="step-button-group">
            <button onClick={e => prevStep(e)} disabled={step === 0} className="button-orange" ref={prevBtnRef}>Prev</button>
            <button onClick={e => nextStep(e)} disabled={false} className="button-orange" ref={nextBtnRef}>{step === 4? "Submit" : "Next"}</button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}

export default RecipeModal;