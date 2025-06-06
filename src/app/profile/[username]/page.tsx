import {
    getProfileByUsername,
    getUserLikedPosts,
    getUserPosts,
    isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

export async function generateMetadata({ params }: { params: { username: string } }) {
    const user = await getProfileByUsername(params.username);
    if (!user) return notFound();

    return {
        title: `${user.name ?? user.username}`,
        description: user.bio || `Check out ${user.username}'s profile.`,
    };
}

async function ProfilePageServer({ params }: { params: { username: string } }) {
    const user = await getProfileByUsername(params.username);

    if (!user) return;

    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
        getUserPosts(user.id),
        getUserLikedPosts(user.id),
        isFollowing(user.id),
    ]);

    return (
        <ProfilePageClient
            user={user}
            posts={posts}
            likedPosts={likedPosts}
            isFollowing={isCurrentUserFollowing}
        />
        // <div>
        //     <h1>hello world</h1>
        // </div>

    );
}
export default ProfilePageServer;



