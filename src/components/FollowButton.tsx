"use client"
import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.action";

export default function FollowButton({ userId }: { userId: string }) {
    const [isLoading, setLoading] = useState(false);

    const handleFollow = async () => {
        setLoading(true);

        try {
            await toggleFollow(userId);
            toast.success("User followed successfully");

        }
        catch (err) {
            toast.error("Error in following user");
        }
        finally {
            setLoading(false);
        }

    }
    return (
        <Button
            size={"sm"}
            variant={"secondary"}
            onClick={handleFollow}
            disabled={isLoading}
            className="w-20"
        >
            {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Follow"}
        </Button>
    )
}
