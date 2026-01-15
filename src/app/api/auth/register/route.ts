import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cloneTemplateForNewUser } from '@/lib/onboarding';

const registerSchema = z.object({
    username: z.string().min(3, '用户名至少需要3个字符').regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和减号'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码至少需要6个字符'),
    name: z.string().optional()
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Validate Input
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { username, email, password, name } = result.data;

        // 2. Check existence
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
            }
            if (existingUser.username === username) {
                return NextResponse.json({ error: '该用户名已被占用' }, { status: 409 });
            }
        }

        // 3. Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                name: name || username
            }
        });

        // 4. Onboarding: Clone Template Data
        // Run asynchronously to not block response? No, best to ensure it's ready for login.
        try {
            await cloneTemplateForNewUser(newUser.id);
        } catch (cloneError) {
            console.error('Failed to clone template data:', cloneError);
            // Don't fail the registration, just log it. User starts empty.
        }

        return NextResponse.json(
            { message: '注册成功', userId: newUser.id },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: '注册失败，请稍后重试' },
            { status: 500 }
        );
    }
}
