const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserController = require('../controllers/users');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cd) => {
        cd(null, './uploads/');
    },
    filename: (req, file, cd) => {
        cd(null, Math.floor(Math.random() * 1000) + file.originalname);
    }
});
const upload = multer({ storage: storage });

// LOGIN USER
router.post('/login', UserController.login);

// ADD NEW USER
router.post('/', upload.single('photo'), UserController.new);

// GET ALL USERS
router.get('/', UserController.all);

// GET SINGLE USER
router.get('/:id', auth, UserController.single);

// GET ALL FOLDERS
router.get('/:id/folders', auth, UserController.all_folders);

// ADD NEW FOLDER
router.post('/:id/folder', auth, UserController.new_folder);

// DELETE FOLDER
router.delete('/:id/folder/:folderName', auth, UserController.delete_folder);

// UPDATE USER
// router.put('/:id', auth, UserController.update);

// DELETE USER
// router.delete('/:id', auth, UserController.delete);

module.exports = router;