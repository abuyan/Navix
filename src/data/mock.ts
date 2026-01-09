export type Site = {
    id: string;
    title: string;
    url: string;
    description: string;
    icon?: string; // URL to icon or emoji
    visits: number;
};

export type Category = {
    id: string;
    name: string;
    sites: Site[];
};

export const mockData: Category[] = [
    {
        id: "productivity",
        name: "效率工具",
        sites: [
            {
                id: "1",
                title: "Notion",
                url: "https://www.notion.so",
                description: "All-in-one workspace for notes and docs.",
                icon: "https://www.notion.so/images/favicon.ico",
                visits: 1205,
            },
            {
                id: "2",
                title: "Figma",
                url: "https://www.figma.com",
                description: "Collaborative interface design tool.",
                icon: "https://static.figma.com/app/icon/1/favicon.ico",
                visits: 980,
            },
            {
                id: "3",
                title: "ChatGPT",
                url: "https://chat.openai.com",
                description: "AI conversational agent.",
                icon: "https://chat.openai.com/favicon.ico",
                visits: 2300,
            },
        ],
    },
    {
        id: "design",
        name: "设计灵感",
        sites: [
            {
                id: "4",
                title: "Dribbble",
                url: "https://dribbble.com",
                description: "Discover the world’s top designers.",
                icon: "https://cdn.dribbble.com/assets/favicon-b3852513460de56855dce784fe2f47703ef58c504037563177264857754b2aee.ico",
                visits: 850,
            },
            {
                id: "5",
                title: "Behance",
                url: "https://www.behance.net",
                description: "Showcase and discover creative work.",
                icon: "https://a5.behance.net/ab0523b092df4488825a07c390554760/img/site/favicon.ico?cb=264615658",
                visits: 760,
            },
            {
                id: "6",
                title: "Pinterest",
                url: "https://www.pinterest.com",
                description: "Image sharing and social media service.",
                icon: "https://s.pinimg.com/webapp/favicon-54a5b2.png",
                visits: 1100,
            },
        ],
    },
    {
        id: "dev",
        name: "开发资源",
        sites: [
            {
                id: "7",
                title: "GitHub",
                url: "https://github.com",
                description: "Development platform inspired by the way you work.",
                icon: "https://github.githubassets.com/favicons/favicon.svg",
                visits: 4500,
            },
            {
                id: "8",
                title: "Vercel",
                url: "https://vercel.com",
                description: "Develop. Preview. Ship.",
                icon: "https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico",
                visits: 600,
            },
            {
                id: "9",
                title: "Tailwind CSS",
                url: "https://tailwindcss.com",
                description: "Rapidly build modern websites.",
                icon: "https://tailwindcss.com/favicons/favicon.ico",
                visits: 890,
            },
        ],
    },
];
