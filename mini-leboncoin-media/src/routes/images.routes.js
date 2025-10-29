import { Router } from 'express';
import { saveBase64Images, deleteImages, staticRouter } from '../utils/storage.js';

const router = Router();

router.post('/images', async (req, res) => {
  const { images = [], subdir = 'ads' } = req.body ?? {};
  const list = Array.isArray(images) ? images : [images];
  const saved = await saveBase64Images(list, { subdir });
  
  const base = `${req.protocol}://${req.get('host')}`;
  const withUrls = saved.map((img) => ({ ...img, url: `${base}/uploads/${img.path}` }));
  res.json({ images: withUrls });
});

router.post('/images/delete', async (req, res) => {
  const { paths = [] } = req.body ?? {};
  await deleteImages(paths);
  res.json({ deleted: Array.isArray(paths) ? paths.length : 0 });
});

router.use('/uploads', staticRouter());

export default router;

