const express = require('express');
const multer = require('multer');
const { clerkProtect } = require('../middleware/clerk/clerkAuth');
const { STAFF_ROLES } = require('../constants/roles');
const chatController = require('../controllers/chatController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// chatActor discriminator is chat-internal: 'staff' (any admin role) or 'client'
function setChatActor(req, _res, next) {
  req.chatActor = {
    type: STAFF_ROLES.includes(req.user?.role) ? 'staff' : 'client',
    id: req.user?._id,
  };
  next();
}

router.use(clerkProtect, setChatActor);

router.get('/', chatController.listConversations);
router.post('/attachments', upload.single('file'), chatController.uploadAttachment);
router.post('/', chatController.createConversation);

router.get('/:conversationId', chatController.getConversation);
router.patch('/:conversationId', chatController.updateConversation);
router.get('/:conversationId/messages', chatController.getMessages);
router.post('/:conversationId/messages', (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.array('files', 10)(req, res, (err) => {
      if (err) return res.status(400).json({ status: 'fail', message: err.message || 'File upload failed' });
      next();
    });
  }
  next();
}, chatController.sendMessage);
router.delete('/:conversationId/messages/:messageId', chatController.deleteMessage);
router.post('/:conversationId/read', chatController.markRead);
router.post('/:conversationId/clear', chatController.clearConversation);
router.post('/:conversationId/archive', chatController.setArchiveConversation);
router.post('/:conversationId/leave', chatController.leaveConversation);
router.delete('/:conversationId', chatController.deleteConversation);
router.patch('/:conversationId/participants', chatController.updateParticipants);

module.exports = router;
