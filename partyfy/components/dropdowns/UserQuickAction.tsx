import { BsFillPersonFill } from 'react-icons/bs';
import { IoMdArrowDropdown } from 'react-icons/io';

import { PartyfyProductType } from '@/helpers/PartyfyProductType';
import useComponentVisible from '@/hooks/useComponentVisible';
import UserContext from '@/providers/UserContext';
import { useContext } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { FaLinkSlash, FaPersonWalkingArrowRight } from "react-icons/fa6";
import Swal from 'sweetalert2/dist/sweetalert2.js';

const UserQuickAction = ({ isAHost, setIsAHost, setSpotifyAuthenticated, getUser } : { isAHost: boolean, setIsAHost: Function, setSpotifyAuthenticated: Function, getUser: Function }) =>  {

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true);

    const { user } = useContext(UserContext);

    async function checkUsername(username) {
        if (username.length < 1 || username.length > 16) return false;
        const response = await fetch('/api/database/username', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            UserID: user.getUserID(),
            Username: username
          })
        })
        try {
          let data = await response.json();
          if ('duplicate' in data && data.duplicate) return false;
        } catch (e) {
          return false;
        }
        return true;
      }

    const deleteAccount = async () => {
        let confirmation = await Swal.fire({
            title: 'Are you sure?',
            text: "This action CANNOT be undone!",
            icon: 'warning',
            showCancelButton: true
        })
        if (confirmation.isConfirmed) {
            const res = await fetch('/api/database/users?UserID=' + user.getUserID(), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                window.location.href = '/api/auth/logout';
            }
        }
    }

    const unlinkSpotify = async () => {
        let confirmation = await Swal.fire({
            title: 'Are you sure you want to unlink your Spotify Account?',
            text: "This action CANNOT be undone!",
            icon: 'warning',
            showCancelButton: true
        })
        if (confirmation.isConfirmed) {
            const res = await fetch('/api/database/users?action=unlink&UserID=' + user.getUserID(), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setSpotifyAuthenticated(false);
        }
    }

    const changeUsername = async () => {
        let newUsername = null;
          let { value: username } = await Swal.fire({
            title: 'Change Username.',
            input: 'text',
            inputLabel: 'Your new username. Choose up to 16 characters.',
            inputPlaceholder: 'johndoe24',
            showCancelButton: true,
          })
          if (!username) return;
          newUsername = username;
          let usernameOK = false;
          while (!usernameOK) {
            if (!(await checkUsername(newUsername))) {
              let alertTitle = newUsername.length > 16 ? 'Your username is too long.' : `${newUsername} is already taken. Please try another.`;
              let { value: userName } = await Swal.fire({
                title: alertTitle,
                input: 'text',
                inputLabel: 'Your new username. Choose up to 16 characters.',
                inputPlaceholder: 'johndoe24',
                showCancelButton: true,
              })
              if (!userName) return;
              newUsername = userName;
            } else {
              usernameOK = true;
              fetch('/api/database/users', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.getUserID(),
                    mode: 'changeUsername',
                    Username: newUsername
                })
              })
                .then(response => response.json())
                .then(data => {
                    Swal.fire({
                        title: `Username changed to ${newUsername} successfully.`,
                        icon: 'success',
                        timer: 1000,
                        showConfirmButton: false
                    })     
                    // Refetch User details to show that the username has changed on top of screen
                    getUser();
                    window.location.reload();
                })
              return;
            }
          }
    }

    function getProductTypeAsString(type: PartyfyProductType): string {
        switch (type) {
            case PartyfyProductType.FREE:
                return 'Free';
            case PartyfyProductType.PREMIUM:
                return 'Premium';
            case PartyfyProductType.COMMERCIAL:
                return 'Commercial';
            default:
                return 'Free';
        }
    }

    return (
        <div ref={ref}>
            <div id="user-quick-action-btn" className={`flex align-center mr-2 cursor-pointer p-1 mt-2 ps-2 btn rounded-lg shadow-md text-white ${isComponentVisible ? 'tab-active' : 'bg-primary'}`} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <BsFillPersonFill size={40} />
                <IoMdArrowDropdown className='mt-2' size={25} />
            </div>
            {
                isComponentVisible &&
                <div className='z-[2] p-3 min-w-40 absolute right-0 mr-2 bg-zinc-800 rounded-md flex flex-col gap-2 shadow-lg'>
                    {
                        user &&
                        <div>
                            <h3 className="text-center mb-2 text-xl">Quick Actions</h3>
                            <p className="text-center">User type: {getProductTypeAsString(user.getProductType())}</p>
                        </div>
                    }
                    <button id="delete-account-btn" className="btn btn-error flex justify-start" onClick={() => deleteAccount()}><FaTrash className='mr-2'/> Delete Account</button>
                    <button id="change-username-btn" className="btn btn-secondary flex justify-start" onClick={() => changeUsername()}><FaEdit className='mr-2' /> Change Username</button>
                    <button id="unlink-spotify-btn" className="btn bg-green-700 flex justify-start" onClick={() => unlinkSpotify()}><FaLinkSlash className='mr-2'/> Unlink Spotify</button>
                    <a id="logout-btn" href="/api/auth/logout" className="btn btn-primary flex justify-start" onClick={() => setIsComponentVisible(!isComponentVisible)}><FaPersonWalkingArrowRight className='mr-2' />Log Out {user.db.Username}</a>
                </div>
            }
        </div>
    )
}

export default UserQuickAction;