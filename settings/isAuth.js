module.exports = {
    isLoggedIn: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        // req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/welcome');
    },
    isAdmin: function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.googleId == '113836366338657524799') {
                return next();
            }
        }
        // req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/welcome');
    },
    isntLoggedIn: function (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        // req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/');
    },
};