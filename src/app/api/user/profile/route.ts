import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name || typeof name !== 'string' || name.length < 1 || name.length > 50) {
            return NextResponse.json(
                { error: "昵称长度必须在 1 到 50 个字符之间" },
                { status: 400 }
            );
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { name },
        });

        return NextResponse.json({
            message: "昵称已更新",
            user: {
                name: user.name,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return NextResponse.json(
            { error: "更新失败，请稍后重试" },
            { status: 500 }
        );
    }
}
