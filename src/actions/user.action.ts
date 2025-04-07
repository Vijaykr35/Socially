"use server"

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import toast from "react-hot-toast";
import { revalidatePath } from "next/cache";

export async function syncUser(userId: string) {
    try {
        const { userId } = await auth()
        const user = await currentUser()
        if (!userId || !user) return;
        //check for existing user
        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: userId
            }
        });
        if (existingUser) return existingUser;

        const dbUser = await prisma.user.create({
            data: {
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl
            }



        });
        return dbUser;
    }
    catch (error) {
        console.log(`errorin sync user ${error}`);
    }
}

export async function getUserByClerkId(clerkId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                clerkId: clerkId
            },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true
                    }
                }
            }
        });
        return user;
    }
    catch (error) {
        console.log(`errorin getUserByClerkId ${error}`);
    }

}

export async function getDbUserId() {
    const { userId: clerkId } = await auth();


    if (!clerkId) return null;
    const user = await getUserByClerkId(clerkId);
    if (!user) throw new Error("user not found");
    return user.id;

}

export async function getRandomUsers() {
    try {
        const userId = await getDbUserId();

        if (!userId) return [];

        // get 3 random users exclude ourselves & users that we already follow
        const randomUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },
                    {
                        NOT: {
                            followers: {
                                some: {
                                    followerId: userId,
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true,
                    },
                },
            },
            take: 3,
        });

        return randomUsers;
    } catch (error) {
        console.log("Error fetching random users", error);
        return [];
    }


}

export async function toggleFollow(TargetUserId: string) {
    try {
        const userId = await getDbUserId();
        if(!userId) return ;

        if (userId === TargetUserId) throw new Error("You cannot follow yourself");

        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: TargetUserId,
                },
            },
        });

        if (existingFollow) {
            //unfollow the user
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: TargetUserId,
                    },
                },
            });
        }
        else {
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: userId,
                        followingId: TargetUserId,
                    },
                }),

                prisma.notification.create({
                    data: {
                        type: "FOLLOW",
                        userId: TargetUserId, // user being followed
                        creatorId: userId, // user following
                    },
                }),
            ]);
        }

        revalidatePath("/");
        return { success: true };

    }
    catch (error) {
        toast.error("Error in following user");
    }
}