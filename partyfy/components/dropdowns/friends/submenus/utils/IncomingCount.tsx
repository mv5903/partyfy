import { Supabase } from "@/helpers/SupabaseHelper";
import { getUserID } from "@/helpers/Utils";
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { Users } from "@prisma/client";
import { useEffect, useState } from "react";

const IncomingCount = ({ user } : { user : UserProfile } ) => {
    const [numberOfRequests, setNumberOfRequests] = useState(0);

    async function fetchRequests() {
        const response = await fetch('/api/database/friends?UserID=' + getUserID(user) + '&action=requests')
        const data = await response.json() as Users[];
        if (data) {
            setNumberOfRequests(data.length);
        }
    }

    useEffect(() => {
        fetchRequests();
        Supabase
            .channel('IncomingCount')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchRequests();
            })
            .subscribe();

        return () => {
            Supabase.channel('IncomingCount').unsubscribe();
        }
    }, [user]);


    if (numberOfRequests > 0) return <span className="dot dot-error"></span>;
    return null;
}

export default IncomingCount;