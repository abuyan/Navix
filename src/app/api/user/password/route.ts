import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "请提供当前密码和新密码" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "新密码长度至少需要 6 个字符" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { error: "用户不存在或未设置密码" },
                { status: 404 }
            );
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: "当前密码不正确" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            message: "密码修改成功",
        });
    } catch (error) {
        console.error("[PASSWORD_UPDATE]", error);
        return NextResponse.json(
            { error: "修改失败，请稍后重试" },
            { status: 500 }
        );
    }
}
