import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { join } from "path";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), "public/uploads/avatars");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        // Generate unique filename
        const ext = path.extname(file.name) || ".jpg";
        const filename = `${session.user.id}-${Date.now()}${ext}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);

        const imageUrl = `/uploads/avatars/${filename}`;

        // Update user profile
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl },
        });

        return NextResponse.json({ url: imageUrl });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
