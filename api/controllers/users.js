const User = require('../models/users');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const fs = require('fs');
const Path = require('path');

mongoose.connect(`${config.DB_URL}/${config.DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// USER LOGIN
exports.login = (req, res) => {
    User.findOne({ userName: req.body.user_name }).exec().then(usr => {

        if (usr == null) {
            res.status(404).json({
                msg: "Auth Failed"
            });
        } else {
            bcrypt.compare(req.body.password, usr.password, (err, resp) => {
                if (err) {
                    res.status(401).json({
                        msg: "Auth Failed1"
                    });
                } else {
                    if (resp) {
                        const token = jwt.sign({
                            userName: usr.userName,
                            userId: usr._id
                        }, "secret", {
                            expiresIn: "1y"
                        });
                        res.status(200).json({
                            msg: "Authenticated",
                            token: token
                        });
                    } else {
                        res.status(401).json({
                            msg: "Auth Failed2"
                        });
                    }
                }
            });
        }
    }).catch(err => console.log(err))
}

// USER GET ALL
exports.all = (req, res) => {

    User.find().exec().then(doc => {
        res.status(200).json({
            count: doc.length,
            data: doc
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
    });
}

// USER GET SINGLE
exports.single = (req, res) => {
    const id = req.params.id;
    User.findById(id).select('userName ip _id folders').exec().then(doc => {
        console.log(doc);
        if (doc != null) {

            res.status(200).json(doc);
        } else {
            res.status(200).json({
                error: "No User Found"
            });
        }
    }).catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
    });
}

// USER NEW
exports.new = (req, res) => {
    User.find({ userName: req.body.user_name }).exec().then(usr => {
        if (usr.length >= 1) {
            res.status(200).json({
                msg: "User already exists"
            });
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    res.status(500).json({
                        error: err
                    });
                } else {
                    const user = new User({
                        userName: req.body.user_name,
                        ip: req.connection.remoteAddress,
                        password: hash
                    });
                    user.save().then(data => {
                        console.log(data);


                        try {
                            if (!fs.existsSync(__basedir + '/public/' + data._id)) {
                                fs.mkdirSync(__basedir + '/public/' + data.id)
                            }
                        } catch (err) {
                            console.error(err)
                        }

                        res.status(200).json({
                            msg: "New user created",
                            body: data
                        });
                    }).catch(err => console.log(err));
                }
            });
        }
    }).catch(err => console.log(err));
}

exports.all_folders = (req, res) => {
    User.findOne({ _id: req.params.id }).exec().then(usr => {
        res.status(200).json({
            msg: "Success",
            data: {
                user: usr,
                folders: dirTree(__basedir + '/public/' + req.params.id, req.params.id)
            }
        });
    }).catch(err => console.log(err));
}

exports.new_folder = (req, res) => {
    User.findOne({ _id: req.params.id }).exec().then(usr => {

        let existingFolders = fs.readdirSync(__basedir + '/public/' + req.params.id);
        // console.log(existingFolders);
        // return;

        if (!existingFolders.includes(req.body.folder_name)) {
            existingFolders.push(req.body.folder_name);

            try {
                if (!fs.existsSync(__basedir + '/public/' + req.params.id + '/' + req.body.folder_name)) {
                    fs.mkdirSync(__basedir + '/public/' + req.params.id + '/' + req.body.folder_name);

                    res.status(200).json({
                        msg: "Success",
                        data: {
                            user: usr,
                            folders: dirTree(__basedir + '/public/' + req.params.id, req.params.id)
                        }
                    });
                }
            } catch (err) {
                console.error(err);
            }

        } else {
            res.status(200).json({ error: "Folder Already Exists" });
        }

    }).catch(err => console.log(err));
}

exports.delete_folder = (req, res) => {

    User.findOne({ _id: req.params.id }).exec().then(usr => {
        let folderList = fs.readdirSync(__basedir + '/public/' + req.params.id);
        if (folderList.includes(req.params.folderName)) {

            if (fs.readdirSync(__basedir + '/public/' + req.params.id + '/' + req.params.folderName).length == 0) {
                fs.renameSync(__basedir + '/public/' + req.params.id + '/' + req.params.folderName, __basedir + '/public/' + req.params.id + '/_' + req.params.folderName);
                res.status(200).json({
                    msg: "Success",
                    data: {
                        user: usr,
                        folders: dirTree(__basedir + '/public/' + req.params.id, req.params.id)
                    }
                });
            } else {
                deleteNonEmptyFolder(__basedir + '/public/' + req.params.id + '/' + req.params.folderName).then(() => {
                    res.status(200).json({ error: "Folder Deleted" });

                });
            }
        } else {
            res.status(200).json({ error: "Folder Doesn't Exists" });
        }

    }).catch(err => console.log(err));
}

exports.delete_folder_perma = (req, res) => {

    User.findOne({ _id: req.params.id }).exec().then(usr => {
        let folderList = fs.readdirSync(__basedir + '/public/' + req.params.id);
        if (folderList.includes(req.params.folderName)) {

            if (fs.readdirSync(__basedir + '/public/' + req.params.id + '/' + req.params.folderName).length == 0) {
                fs.rmdirSync(__basedir + '/public/' + req.params.id + '/' + req.params.folderName, __basedir + '/public/' + req.params.id + '/_' + req.params.folderName);
                res.status(200).json({
                    msg: "Success",
                    data: {
                        user: usr,
                        folders: dirTree(__basedir + '/public/' + req.params.id, req.params.id)
                    }
                });
            } else {
                deleteNonEmptyFolder(__basedir + '/public/' + req.params.id + '/' + req.params.folderName).then(() => {
                    res.status(200).json({ error: "Folder Deleted" });

                });
            }
        } else {
            res.status(200).json({ error: "Folder Doesn't Exists" });
        }

    }).catch(err => console.log(err));
}

const deleteNonEmptyFolder = async (path, perma = false) => {

    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const filepath = Path.join(path, file);
            if (fs.lstatSync(filepath).isDirectory()) {
                deleteNonEmptyFolder(filepath);
            } else {
                perma ? fs.unlinkSync(filepath) : fs.renameSync(filepath, '_' + filepath);
            }
        });
        perma ? fs.rmdirSync(path) : fs.renameSync(path, '_' + path);
    }
};

const dirTree = (filename, id) => {
    var stats = fs.lstatSync(filename),
        info = {
            name: Path.basename(filename) == id ? "Home" : Path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map((child) => {
            return (child.substring(0, 1) != '_') ? dirTree(filename + '/' + child) : 'null'
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        info.type = "file";
    }

    return info;
}