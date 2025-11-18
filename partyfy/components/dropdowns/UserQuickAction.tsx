import { PartyfyProductType } from '@/helpers/PartyfyProductType';
import UserContext from '@/providers/UserContext';
import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBars, FaEdit, FaTrash } from 'react-icons/fa';
import { FaLinkSlash, FaPersonWalkingArrowRight, FaRightFromBracket } from "react-icons/fa6";
import { useAlert } from '@/hooks/useAlert';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const UserQuickAction = ({ isAHost, setIsAHost, setSpotifyAuthenticated, getUser } : { isAHost: boolean, setIsAHost: Function, setSpotifyAuthenticated: Function, getUser: Function }) =>  {

    const alert = useAlert();
    const { user } = useContext(UserContext);
    const router = useRouter();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

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
        let confirmation = await alert.fire({
            title: 'Are you sure you want to delete your account?',
            text: "This action CANNOT be undone!",
            icon: 'warning',
            showCancelButton: true
        });
        if (confirmation.isConfirmed) {
            const res = await fetch('/api/database/users?UserID=' + user.getUserID(), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                router.push('/api/auth/logout');
            }
        }
    }

    const unlinkSpotify = async () => {
        let confirmation = await alert.fire({
            title: 'Are you sure you want to unlink your Spotify Account?',
            text: "This action CANNOT be undone!",
            icon: 'warning',
            showCancelButton: true
        });
        if (confirmation.isConfirmed) {
            const res = await fetch('/api/database/users?action=unlink&UserID=' + user.getUserID(), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setSpotifyAuthenticated(false);
            setIsSheetOpen(false);
        }
    }

    const changeUsername = async () => {
        let newUsername = null;
          let result = await alert.fire({
            title: 'Change Username.',
            input: 'text',
            inputLabel: 'Your new username. Choose up to 16 characters.',
            inputPlaceholder: 'johndoe24',
            showCancelButton: true,
          })
          if (!result.value) return;
          alert.showLoading();
          newUsername = result.value;
          let usernameOK = false;
          while (!usernameOK) {
            if (!(await checkUsername(newUsername))) {
              let alertTitle = newUsername.length > 16 ? 'Your username is too long.' : `${newUsername} is already taken. Please try another.`;
              let retryResult = await alert.fire({
                title: alertTitle,
                input: 'text',
                inputLabel: 'Your new username. Choose up to 16 characters.',
                inputPlaceholder: 'johndoe24',
                showCancelButton: true,
              })
              if (!retryResult.value) return;
              newUsername = retryResult.value;
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
                    alert.close();
                    alert.fire({
                        title: `Username changed to ${newUsername} successfully.`,
                        icon: 'success',
                    })
                    // Refetch User details to show that the username has changed on top of screen
                    getUser();
                    router.refresh();
                    setIsSheetOpen(false);
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
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button
                    id="user-quick-action-btn"
                    className="flex align-center mr-2 cursor-pointer mt-2 rounded-lg shadow-md"
                >
                    <FaBars size={18} />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-4 bg-stone-900 border-stone-700">
                <SheetHeader>
                    <SheetTitle className="text-white">Settings</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 justify-between h-full">
                  <div className="flex flex-col gap-3 mt-4">
                    <Button
                        id="delete-account-btn"
                        variant="secondary"
                        className="flex justify-start w-full bg-stone-800 text-white"
                        onClick={() => deleteAccount()}
                    >
                        <FaTrash className='mr-2'/> Delete Account
                    </Button>
                    <Button
                        id="change-username-btn"
                        variant="secondary"
                        className="flex justify-start w-full bg-stone-800 text-white"
                        onClick={() => changeUsername()}
                    >
                        <FaEdit className='mr-2' /> Change Username
                    </Button>
                    <Button
                        id="unlink-spotify-btn"
                        className="flex justify-start w-full bg-stone-800 text-white"
                        onClick={() => unlinkSpotify()}
                    >
                        <FaLinkSlash className='mr-2'/> Unlink Spotify
                    </Button>
                  </div>
                  <div>
                    <Button
                        id="logout-btn"
                        asChild
                        variant="secondary"
                        className="flex justify-start w-full bg-stone-700 text-white"
                    >
                        <a href="/api/auth/logout">
                            <FaRightFromBracket className='mr-2' />
                            Log Out {user?.db?.Username}
                        </a>
                    </Button>
                  </div>
                </div>
            </SheetContent>
            <alert.AlertComponent />
        </Sheet>
    )
}

export default UserQuickAction;