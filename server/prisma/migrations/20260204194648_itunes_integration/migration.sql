-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "age" INTEGER,
    "birthDate" DATETIME,
    "city" TEXT,
    "country" TEXT,
    "school" TEXT,
    "work" TEXT,
    "jobTitle" TEXT,
    "website" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "showAge" BOOLEAN NOT NULL DEFAULT true,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "showWork" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "genre" TEXT,
    "director" TEXT,
    "poster" TEXT,
    "rating" REAL,
    "review" TEXT,
    "watchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_shows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "genre" TEXT,
    "seasons" INTEGER,
    "poster" TEXT,
    "rating" REAL,
    "review" TEXT,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tv_shows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "music" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itunesId" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "genre" TEXT,
    "year" INTEGER,
    "rating" REAL,
    "review" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "music_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cuisine" TEXT,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "rating" REAL,
    "review" TEXT,
    "priceRange" TEXT,
    "visitedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "restaurants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "movieId" TEXT,
    "tvShowId" TEXT,
    "musicId" TEXT,
    "restaurantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "likes_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "likes_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "tv_shows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "likes_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "music" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "likes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "movieId" TEXT,
    "tvShowId" TEXT,
    "musicId" TEXT,
    "restaurantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "tv_shows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "music" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "movieId" TEXT,
    "tvShowId" TEXT,
    "musicId" TEXT,
    "restaurantId" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendations_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendations_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendations_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendations_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "tv_shows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendations_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "music" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendations_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "taste_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "movieGenres" TEXT,
    "musicGenres" TEXT,
    "cuisineTypes" TEXT,
    "personalityTags" TEXT,
    "tasteVector" TEXT,
    "lastAnalyzed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "taste_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_movieId_key" ON "likes"("userId", "movieId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_tvShowId_key" ON "likes"("userId", "tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_musicId_key" ON "likes"("userId", "musicId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_restaurantId_key" ON "likes"("userId", "restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "taste_profiles_userId_key" ON "taste_profiles"("userId");
