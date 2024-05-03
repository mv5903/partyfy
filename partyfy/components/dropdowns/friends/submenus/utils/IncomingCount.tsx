import PartyfyUser from "@/helpers/PartyfyUser";
import { Supabase } from "@/helpers/SupabaseHelper";
import UserContext from "@/providers/UserContext";
import { useContext, useEffect, useState } from "react";

const IncomingCount = () => {
    const { user } = useContext(UserContext);
    const [numberOfRequests, setNumberOfRequests] = useState(0);

    async function fetchRequests() {
        const response = await fetch('/api/database/friends?UserID=' + user.getUserID() + '&action=requests')
        const data = await response.json() as PartyfyUser[];
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