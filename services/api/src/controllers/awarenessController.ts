import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import {
  AwarenessItem,
  AwarenessContentType,
  AwarenessCategory,
  AwarenessPublishStatus,
} from '@phc-connect/types';

export class AwarenessController {
  /**
   * GET /api/awareness
   * Public endpoint to query awareness content with filters
   */
  public static getAwarenessItems(req: Request, res: Response): void {
    try {
      const { type, category, search, isFeatured, isUrgent, status } = req.query;

      let items = [...DataStore.awarenessItems];

      // Filter by publish status (Public users only get PUBLISHED items unless requested specifically)
      const requestedStatus = status ? (status as AwarenessPublishStatus) : 'PUBLISHED';
      if (status !== 'ALL') {
        items = items.filter((item) => item.status === requestedStatus);
      }

      // Filter by Content Type
      if (type && type !== 'ALL') {
        items = items.filter((item) => item.type === (type as AwarenessContentType));
      }

      // Filter by Category
      if (category && category !== 'ALL') {
        items = items.filter((item) => item.category === (category as AwarenessCategory));
      }

      // Filter by Featured
      if (isFeatured === 'true') {
        items = items.filter((item) => item.isFeatured);
      }

      // Filter by Urgent Alert
      if (isUrgent === 'true') {
        items = items.filter((item) => item.isUrgentAlert);
      }

      // Free text search across title, summary, tags, and content in both English and Hindi
      if (search && typeof search === 'string' && search.trim().length > 0) {
        const q = search.toLowerCase().trim();
        items = items.filter((item) => {
          const en = item.translations.en;
          const hi = item.translations.hi;
          const matchEn =
            en?.title.toLowerCase().includes(q) ||
            en?.summary.toLowerCase().includes(q) ||
            en?.content?.toLowerCase().includes(q);
          const matchHi =
            hi?.title.toLowerCase().includes(q) ||
            hi?.summary.toLowerCase().includes(q) ||
            hi?.content?.toLowerCase().includes(q);
          const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
          const matchCategory = item.category.toLowerCase().includes(q);
          return matchEn || matchHi || matchTags || matchCategory;
        });
      }

      // Sort: Urgent alerts & featured first, then newest
      items.sort((a, b) => {
        if (a.isUrgentAlert && !b.isUrgentAlert) return -1;
        if (!a.isUrgentAlert && b.isUrgentAlert) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json({
        success: true,
        count: items.length,
        items,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch awareness content' });
    }
  }

  /**
   * GET /api/awareness/alerts/active
   * Public endpoint for active urgent alerts & vaccination drives
   */
  public static getActiveAlerts(_req: Request, res: Response): void {
    try {
      const now = new Date().getTime();
      const activeAlerts = DataStore.awarenessItems.filter((item) => {
        if (item.status !== 'PUBLISHED') return false;
        const isUrgent = item.isUrgentAlert || item.type === 'HEALTH_ALERT';
        if (!isUrgent) return false;
        if (item.validUntil) {
          const expiry = new Date(item.validUntil).getTime();
          if (now > expiry) return false;
        }
        return true;
      });

      res.json({
        success: true,
        count: activeAlerts.length,
        alerts: activeAlerts,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch active alerts' });
    }
  }

  /**
   * GET /api/awareness/:id
   * Public detail endpoint, increments viewsCount
   */
  public static getAwarenessItemById(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const item = DataStore.awarenessItems.find((i) => i.id === id || i.slug === id);

      if (!item) {
        res.status(404).json({ success: false, message: 'Awareness content not found' });
        return;
      }

      // Increment view counter
      item.viewsCount = (item.viewsCount || 0) + 1;

      res.json({
        success: true,
        item,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch awareness item' });
    }
  }

  /**
   * POST /api/awareness
   * Admin / Health Staff creates a new awareness item
   */
  public static createAwarenessItem(req: AuthRequest, res: Response): void {
    try {
      const {
        type,
        category,
        translations,
        coverImageUrl,
        mediaUrl,
        thumbnailUrl,
        videoDurationSeconds,
        readTimeMinutes,
        tags,
        isFeatured,
        isUrgentAlert,
        validUntil,
        status,
        phcId,
        phcName,
      } = req.body;

      if (!type || !category || !translations?.en?.title || !translations?.hi?.title) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields. Provide type, category, and titles in both English and Hindi.',
        });
        return;
      }

      const now = new Date().toISOString();
      const newId = `aw-${Date.now().toString().slice(-4)}`;
      const rawSlug = translations.en.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const slug = `${rawSlug}-${newId}`;

      const newItem: AwarenessItem = {
        id: newId,
        slug,
        type: type as AwarenessContentType,
        category: category as AwarenessCategory,
        status: (status as AwarenessPublishStatus) || 'PUBLISHED',
        isFeatured: Boolean(isFeatured),
        isUrgentAlert: Boolean(isUrgentAlert),
        validUntil: validUntil || null,
        coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
        mediaUrl: mediaUrl || coverImageUrl || '',
        thumbnailUrl: thumbnailUrl || coverImageUrl || '',
        videoDurationSeconds: videoDurationSeconds ? Number(videoDurationSeconds) : undefined,
        readTimeMinutes: readTimeMinutes ? Number(readTimeMinutes) : 3,
        tags: Array.isArray(tags) ? tags : [],
        authorName: req.user?.fullName || 'Health Education Cell',
        authorRole: req.user?.role || 'HEALTH_ASSISTANT',
        phcId: phcId || 'phc-001',
        phcName: phcName || 'Central Urban PHC - Karol Bagh',
        likesCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        translations,
        createdAt: now,
        updatedAt: now,
        publishedAt: status === 'DRAFT' ? null : now,
      };

      DataStore.awarenessItems.unshift(newItem);

      res.status(201).json({
        success: true,
        message: 'Awareness content published successfully',
        item: newItem,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create awareness content' });
    }
  }

  /**
   * PUT /api/awareness/:id
   * Admin / Staff updates awareness content
   */
  public static updateAwarenessItem(req: AuthRequest, res: Response): void {
    try {
      const { id } = req.params;
      const index = DataStore.awarenessItems.findIndex((i) => i.id === id);

      if (index === -1) {
        res.status(404).json({ success: false, message: 'Awareness item not found' });
        return;
      }

      const existing = DataStore.awarenessItems[index];
      const updates = req.body;
      const now = new Date().toISOString();

      const updatedItem: AwarenessItem = {
        ...existing,
        ...updates,
        id: existing.id, // Immutable ID
        updatedAt: now,
        translations: {
          ...existing.translations,
          ...(updates.translations || {}),
        },
      };

      if (updates.status === 'PUBLISHED' && !existing.publishedAt) {
        updatedItem.publishedAt = now;
      }

      DataStore.awarenessItems[index] = updatedItem;

      res.json({
        success: true,
        message: 'Awareness content updated successfully',
        item: updatedItem,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to update awareness content' });
    }
  }

  /**
   * PATCH /api/awareness/:id/publish
   * Toggle publish status between PUBLISHED, DRAFT, ARCHIVED
   */
  public static togglePublishStatus(req: AuthRequest, res: Response): void {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const item = DataStore.awarenessItems.find((i) => i.id === id);
      if (!item) {
        res.status(404).json({ success: false, message: 'Awareness item not found' });
        return;
      }

      item.status = (status as AwarenessPublishStatus) || (item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED');
      item.updatedAt = new Date().toISOString();
      if (item.status === 'PUBLISHED' && !item.publishedAt) {
        item.publishedAt = new Date().toISOString();
      }

      res.json({
        success: true,
        message: `Status updated to ${item.status}`,
        item,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to toggle publish status' });
    }
  }

  /**
   * DELETE /api/awareness/:id
   * Admin removes awareness item
   */
  public static deleteAwarenessItem(req: AuthRequest, res: Response): void {
    try {
      const { id } = req.params;
      const index = DataStore.awarenessItems.findIndex((i) => i.id === id);

      if (index === -1) {
        res.status(404).json({ success: false, message: 'Awareness item not found' });
        return;
      }

      const deleted = DataStore.awarenessItems.splice(index, 1)[0];

      res.json({
        success: true,
        message: 'Awareness content removed',
        deletedId: deleted.id,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to delete awareness item' });
    }
  }

  /**
   * POST /api/awareness/:id/share
   * Public endpoint to track social shares (WhatsApp / copy link)
   */
  public static shareAwarenessItem(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const item = DataStore.awarenessItems.find((i) => i.id === id);

      if (!item) {
        res.status(404).json({ success: false, message: 'Awareness item not found' });
        return;
      }

      item.sharesCount = (item.sharesCount || 0) + 1;

      res.json({
        success: true,
        sharesCount: item.sharesCount,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to record share' });
    }
  }

  /**
   * POST /api/awareness/:id/like
   * Public endpoint to toggle like counter
   */
  public static likeAwarenessItem(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const item = DataStore.awarenessItems.find((i) => i.id === id);

      if (!item) {
        res.status(404).json({ success: false, message: 'Awareness item not found' });
        return;
      }

      item.likesCount = (item.likesCount || 0) + 1;

      res.json({
        success: true,
        likesCount: item.likesCount,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to record like' });
    }
  }
}
