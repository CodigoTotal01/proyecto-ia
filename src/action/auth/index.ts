"use server";

import { client } from "@/lib/prisma";

export const onCompleteUserRegistration = async (
  fullname: string,
  clerkId: string,
  type: string,
) => {
  try {
    console.log("DAtos que bienen de clear para registrarlo en la base de datos al cliente: ");
    console.log("clerkId", clerkId);
    console.log("fullname", fullname);
    console.log("type", type);
    const registered = await client.user.create({
      data: {
        fullname,
        clerkId,
        type,
        subscription: {
          create: {},
        },
      },
      select: {
        fullname: true,
        id: true,
        type: true,
      },
    });

    if (registered) {
      return { status: 200, user: registered };
    }
  } catch (error: any) {
    console.log("Error al registrar el usuario en la base de datos");
    return { status: 400 };
  }
};
