// ===========================================
// initialData.ts
// ===========================================
export const initialUsers = [
  {
    id: "u1",
    email: "sarah@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "u2",
    email: "alex@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "u3",
    email: "emma@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const initialProfiles = [
  {
    id: "p1",
    userId: "u1",
    name: "Sarah Chen",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah",
    bio: "Passionate designer & AI enthusiast.",
    urls: ["https://sarah.dev"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p2",
    userId: "u2",
    name: "Alex Rivera",
    avatarUrl: "https://i.pravatar.cc/150?u=alex",
    bio: "Senior developer and web tech geek.",
    urls: ["https://alex.dev"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p3",
    userId: "u3",
    name: "Emma Wilson",
    avatarUrl: "https://i.pravatar.cc/150?u=emma",
    bio: "Tech lead focused on sustainability.",
    urls: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const initialCategories = [
  { id: "c1", name: "Technology", isArchived: false },
  { id: "c2", name: "Design", isArchived: false },
  { id: "c3", name: "Business", isArchived: false },
  { id: "c4", name: "AI", isArchived: false },
  { id: "c5", name: "Crypto", isArchived: false },
];

export const initialStories = [
  {
    id: "s1",
    title: "The Future of AI in Modern Interface Design",
    summary:
      "How artificial intelligence is reshaping the way we interact with digital products and the role of designers in this new era.",
    categoryIds: ["c4", "c2"],
    userId: "u1",
    readCount: 1240,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "s2",
    title: "WebAssembly: The Next Big Thing in Web Development?",
    summary:
      "Exploring the potential of WebAssembly to bring desktop-class performance to the web browser.",
    categoryIds: ["c1"],
    userId: "u2",
    readCount: 856,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "s3",
    title: "Sustainable Tech: Building Green Software",
    summary:
      "Why energy efficiency in code matters and how developers can contribute to a more sustainable future.",
    categoryIds: ["c1", "c3"],
    userId: "u3",
    readCount: 623,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const initialStoryCategories = [
  { storyId: "s1", categoryId: "c4" },
  { storyId: "s1", categoryId: "c2" },
  { storyId: "s2", categoryId: "c1" },
  { storyId: "s3", categoryId: "c1" },
  { storyId: "s3", categoryId: "c3" },
];

export const initialLikes = [
  { userId: "u1", storyId: "s2", episodeId: null, createdAt: new Date() },
  { userId: "u2", storyId: "s1", episodeId: null, createdAt: new Date() },
  { userId: "u3", storyId: "s1", episodeId: null, createdAt: new Date() },
];

export const initialComments = [
  {
    id: "cm1",
    userId: "u2",
    storyId: "s1",
    episodeId: null,
    content: "Amazing insights on AI design!",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cm2",
    userId: "u3",
    storyId: "s2",
    episodeId: null,
    content: "WebAssembly looks promising.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
