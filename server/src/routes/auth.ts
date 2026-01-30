import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Kayıt ol
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, name } = req.body;

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email veya kullanıcı adı zaten kullanımda' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
      }
    });

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt sırasında hata oluştu' });
  }
});

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Geçersiz email veya şifre' });
    }

    // Şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Geçersiz email veya şifre' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş sırasında hata oluştu' });
  }
});

// Profil bilgilerini getir
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token gerekli' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        age: true,
        birthDate: true,
        city: true,
        country: true,
        school: true,
        work: true,
        jobTitle: true,
        website: true,
        isPrivate: true,
        showAge: true,
        showLocation: true,
        showWork: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(401).json({ error: 'Geçersiz token' });
  }
});

// Profil güncelle
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token gerekli' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const {
      name,
      bio,
      avatar,
      age,
      birthDate,
      city,
      country,
      school,
      work,
      jobTitle,
      website,
      isPrivate,
      showAge,
      showLocation,
      showWork
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name,
        bio,
        avatar,
        age: age ? parseInt(age) : null,
        birthDate: birthDate ? new Date(birthDate) : null,
        city,
        country,
        school,
        work,
        jobTitle,
        website,
        isPrivate: isPrivate ?? false,
        showAge: showAge ?? true,
        showLocation: showLocation ?? true,
        showWork: showWork ?? true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        age: true,
        birthDate: true,
        city: true,
        country: true,
        school: true,
        work: true,
        jobTitle: true,
        website: true,
        isPrivate: true,
        showAge: true,
        showLocation: true,
        showWork: true,
        createdAt: true,
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu' });
  }
});

// Avatar yükle
router.post('/upload-avatar', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token gerekli' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar URL gerekli' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { avatar },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Avatar yüklenirken hata oluştu' });
  }
});

export default router;