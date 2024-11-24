import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
    });
    return bookmarks;
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    return this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    return await this.prisma.bookmark.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async editBookmart(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });
    if (!bookmark || bookmark.userId !== userId) {
      throw new ForbiddenException('Access to resource denied');
    }

    // console.log('\n\n\n\nDTO: ', dto, '\n\n\n\n');

    return this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmark(userId: number, bookmarkId: number) {
    console.log('\n\n\n\nbookmarkid: ', bookmarkId, '\n\n\n\n');
    console.log('\n\n\n\nuserId: ', userId, '\n\n\n\n');

    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });
    if (!bookmark || bookmark.userId !== userId) {
      throw new ForbiddenException('Access to resource denied');
    }

    return this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}

// 055 366 5049
