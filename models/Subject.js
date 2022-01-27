const mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate')

const SubjectSchema = new mongoose.Schema({
    subject: String,
    semester: Number,
    modifiedby: [{ user: String, date: { type: Date, default: Date.now } }],
    items:
        [{
            item: String,
            percentage: Number,
            data:
                [{
                    percentage: Number,
                    total: Number,
                    index: { type: Number, default: 0 },
                    grades:
                        [{
                            grade: { type: Number, default: null },
                            user: { type: String, default: 'null' }
                        }]
                }]
        }],
    totalgrade: [{
        grade: { type: Number, default: null },
        user: { type: String, default: null }
    }]
});

SubjectSchema.plugin(findOrCreate);

const Subject = mongoose.model('Subject', SubjectSchema);

module.exports = Subject;