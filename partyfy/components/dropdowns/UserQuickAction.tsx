import { BsFillPersonFill } from 'react-icons/bs';
import { IoMdArrowDropdown } from 'react-icons/io';
import { isMobile } from 'react-device-detect';

import Options from '@/components/host/Options';
import useComponentVisible from '@/hooks/useComponentVisible';

import { UserProfile } from '@auth0/nextjs-auth0/client';
import { getUserID } from '@/helpers/Utils';
import Swal from 'sweetalert2/dist/sweetalert2.js';

const UserQuickAction = ({ user, isAHost, setIsAHost, setSpotifyAuthenticated, getUser } : { user: UserProfile, isAHost: boolean, setIsAHost: Function, setSpotifyAuthenticated: Function, getUser: Function }) =>  {

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true);

    async function checkUsername(username) {
        if (username.length < 1 || username.length > 16) return false;
        const response = await fetch('/api/database/username', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            UserID: user?.sub ?? user?.user_id,
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
            const res = await fetch('/api/database/users?UserID=' + getUserID(user), {
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
            const res = await fetch('/api/database/users?action=unlink&UserID=' + getUserID(user), {
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
                    UserID: getUserID(user),
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
                })
              return;
            }
          }
    }

    return (
        <div ref={ref}>
            <div className={`flex align-center me-2 cursor-pointer ${isComponentVisible ? 'bg-secondary' : 'bg-gray-800'} p-1 rounded mt-2`} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <BsFillPersonFill size={40} />
                <IoMdArrowDropdown className='mt-2' size={25} />
            </div>
            {
                isComponentVisible &&
                <div className='z-[2] px-3 py-4 min-w-40 absolute right-0 bg-[#333] rounded-md flex flex-col gap-2'>
                    {
                        !isMobile && isAHost &&
                        <Options />
                    }
                    {
                        !isMobile && isAHost != null &&
                        <button className="btn btn-primary" onClick={() => { setIsComponentVisible(!isComponentVisible); setIsAHost(null); }}>Return to Mode Selection</button>
                    }
                    <button className="btn btn-error" onClick={() => deleteAccount()}>Delete my account</button>
                    <button className="btn btn-secondary" onClick={() => changeUsername()}>Change Username</button>
                    <button className="btn btn-warning" onClick={() => unlinkSpotify()}>Unlink Spotify</button>
                    <a href="/api/auth/logout" className="btn btn-primary" onClick={() => setIsComponentVisible(!isComponentVisible)}>Log Out</a>
                </div>
            }
        </div>
    )
}

export default UserQuickAction;