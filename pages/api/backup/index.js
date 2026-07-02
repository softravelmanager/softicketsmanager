import { apiHandler, usersRepo } from 'helpers/api';
import JSZip from 'jszip';

const { getCollections } = require('../../../exportBackups.js');

export default apiHandler({
  get: getBackup,
});

async function getBackup(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await usersRepo.getById(userId);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return res.status(500).json({ message: 'Database URI not configured.' });
  }

  const collections = await getCollections(mongoUri);
  const zip = new JSZip();
  Object.entries(collections).forEach(([fileName, content]) => {
    zip.file(fileName, content);
  });

  const archive = await zip.generateAsync({ type: 'nodebuffer' });
  const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.status(200).send(archive);
}
