import React, {useEffect, useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {getAuth, updateProfile} from "firebase/auth";
import {doc, updateDoc} from "firebase/firestore";
import {db} from "../firebase.config";
import editIcon from "../assets/edit.png"
import doneIcon from "../assets/done.png"
import RecipeModal from "../components/RecipeModal";

export default function Profile({}) {
  const auth = getAuth()

  const navigate = useNavigate()

  const [changeName, setChangeName] = useState(false)
  const [nameField, setNameField] = useState(auth.currentUser.displayName);
  const [showModal, setShowModal] = useState(false)

  const handleChangeName = () => {
    if (changeName) {
      updateProfile(auth.currentUser, {
        displayName: nameField
      }).then(async () => {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {name: nameField})
        toast.success(`Username changed to ${nameField}`)
      })
    } else {

    }
    setChangeName(prev => !prev)
  }

  return (
    <div className="profile-page-container">
      <div className="container">
        <div className="profile-page">
          <h2 className="profile-title">Welcome, {auth.currentUser.displayName}!</h2>
          <div className="account-info-container">
            <h3 className="account-header">Account information</h3>
            <div className="account-info">
              <div className="account-input-group">
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" className={`profile-input ${changeName ? "changing-name" : ""}`}
                       value={nameField} disabled={!changeName}
                       onChange={(e) => setNameField(e.target.value)}
                />
                <img src={changeName? doneIcon : editIcon} alt={changeName? "Done" : "Edit"}
                     className="name-icon" onClick={handleChangeName}
                />
              </div>
              <div className="account-input-group">
                <label>Email:</label>
                <input type="text" value={auth.currentUser.email} disabled={true} className="profile-input"/>
              </div>
            </div>
          </div>
          <button className="button-orange add-button"
                  onClick={() => setShowModal(true)}
          >+ Add Recipe
          </button>
        </div>
        <div className="profile-bottom">
          <div className="category-card" onClick={() => navigate("/my-recipes")}>
            <h2 className="category-card-title">My Recipes</h2>
          </div>
          <div className="category-card" onClick={() => navigate("/liked-recipes")}>
            <h2 className="category-card-title">Liked Recipes</h2>
          </div>
        </div>
      </div>
      <RecipeModal showModal={showModal} setShowModal={setShowModal}/>
    </div>
  )
}