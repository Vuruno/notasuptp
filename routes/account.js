const express = require('express');
const router = express.Router();
const { isLoggedIn, isntLoggedIn } = require('../settings/isAuth');
const Subject = require('../models/Subject')
const User = require('../models/User');
const req = require('express/lib/request');
const { redirect } = require('express/lib/response');
const { createHW, updateHW, getHW, deleteHW, allHW, updateSubjectName } = require('../settings/calendarapi')

const empyUser = { googleId: "", picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Circle-icons-profile.svg/1024px-Circle-icons-profile.svg.png", name: { givenName: "UPTP", familyName: "" }, email: "", enrolled: [] }

function toEmpy(str) {
    if (str == '0') return ''
    return str
}

router.get('/', isLoggedIn, async function (req, res) {
    let mySubjects = []
    req.user.enrolled.forEach(function (subject) { })

    if (req.user.enrolled.length < 1) res.redirect('/account/courses')
    else res.render('mysubjects', { user: req.user || empyUser, allSubjects: await Subject.find() })
})

router.get('/mygrades', isLoggedIn, async function (req, res) {
    if (req.user.enrolled.length < 1) res.redirect('/account/courses')
    else res.render('mygrades', { user: req.user || empyUser, allSubjects: await Subject.find() })
})

router.get('/grupal', isLoggedIn, async function (req, res) {
    if (req.user.enrolled.length < 1) res.redirect('/account/courses')
    else res.render('dashboardgrupal', { user: req.user || empyUser, allSubjects: await Subject.find() })
})

router.get('/courses', isLoggedIn, async function (req, res) {
    const subjects = await Subject.find().sort({ semester: 'asc', subject: 'asc' })
    var mySubjects = []
    req.user.enrolled.forEach(function (subject) {
        mySubjects.push(subject.id)
    })

    res.render('courses', {
        user: req.user || empyUser,
        subjects: subjects,
        mySubjects: mySubjects
    })
})

router.get('/coursenoexists', async function (req, res) {
    res.render('coursenoexists', { user: req.user || empyUser })
})

router.get('/notenrolledin:subjectid', isLoggedIn, async function (req, res) {
    let subjectId = req.params.subjectid
    let subject = await Subject.findOne({ _id: subjectId })
    res.render('notenrolledin', { user: req.user || empyUser, subject: subject })
})

router.get('/course:subjectid', async function (req, res) {
    try {
        let subjectId = req.params.subjectid
        let subject = await Subject.findOne({ _id: subjectId })
        //verify if subject exists and user is enrolled in
        if (subject == null) {
            res.redirect('/account/coursenoexists')
        } else if (req.user == undefined) {
            res.render('course', { user: empyUser, subject: subject })
        } else if (req.user.enrolled.map(function (e) { return e.id; }).indexOf(String(subject._id)) > -1) {
            let allHw = await allHW(req.user || empyUser)
            res.render('course', { user: req.user || empyUser, subject: subject, allHw: allHw })
        } else {
            res.redirect(`/account/notenrolledin${subjectId}`)
        }
    } catch (e) {
        res.redirect('/')
    }
})

router.get('/grupal/:id', isLoggedIn, function (req, res) {
    let id = req.params.id
    Subject.findOne({ _id: id }, function (err, subject) {
        if (err) res.redirect('/account/coursenoexists')
        else if (req.user.enrolled.map(function (e) { return e.id; }).indexOf(String(subject._id)) > -1
            && subject.totalgrade[subject.totalgrade.map(function (e) { return e.user; }).indexOf(String(req.user.googleId))].grade != null) {
            res.render('grupal', { user: req.user || empyUser, subject: subject })
        } else {
            res.redirect('/account/coursenoexists')
        }
    })
})

router.get('/updatesubject', isLoggedIn, function (req, res) {
    res.render('updatesubject', { user: req.user || empyUser })
})

router.get('/updatesubject:id', isLoggedIn, async function (req, res) {
    let subjectToEdit = await Subject.findOne({ _id: req.params.id.slice(1, req.params.id.length + 1) })

    let tot_midterm = [], tot_quiz = [], per_each_midterm = [], per_each_quiz = [], tot_hw = [], per_each_hw = []
    let id = req.params.id.slice(1, req.params.id.length + 1)

    let subject = subjectToEdit.subject
    let semester = subjectToEdit.semester
    let meeting = subjectToEdit.meeting
    let classroom = subjectToEdit.classroom

    let per_final = subjectToEdit.items[0].percentage
    let tot_final = subjectToEdit.items[0].data[0].total

    let per_midterm = subjectToEdit.items[1].percentage
    subjectToEdit.items[1].data.forEach(function (x) {
        tot_midterm.push(x.total)
        per_each_midterm.push(x.percentage)
    })

    let per_quiz = subjectToEdit.items[6].percentage
    subjectToEdit.items[6].data.forEach(function (x) {
        tot_quiz.push(x.total)
        per_each_quiz.push(x.percentage)
    })

    let per_hw = subjectToEdit.items[2].percentage
    subjectToEdit.items[2].data.forEach(function (x) {
        tot_hw.push(x.total)
        per_each_hw.push(x.percentage)
    })

    let per_la = subjectToEdit.items[3].percentage
    let tot_la = subjectToEdit.items[3].data[0].total

    let per_attendance = subjectToEdit.items[4].percentage
    let tot_attendance = subjectToEdit.items[4].data[0].total

    let per_bonus = subjectToEdit.items[5].percentage
    let tot_bonus = subjectToEdit.items[5].data[0].total

    res.render('updatesubject', {
        user: req.user, id,
        subject, meeting, classroom, semester, per_final, tot_final,
        per_midterm, tot_midterm, per_each_midterm,
        per_quiz, tot_quiz, per_each_quiz,
        per_hw, tot_hw, per_each_hw,
        per_la, tot_la,
        per_attendance, tot_attendance,
        per_bonus, tot_bonus
    });
})

router.get('/create-hw', isLoggedIn, async function (req, res) {
    res.render('newhw', { user: req.user })
})

router.get('/create-hw:subject', isLoggedIn, async function (req, res) {
    let subject = req.params.subject
    res.render('newhw', { user: req.user, subject })
})

router.get('/update-hw:id', isLoggedIn, async function (req, res) {
    let id = req.params.id
    let hw = await getHW(id)
    if (hw != null) {
        let end = new Date(hw.data.end.dateTime)
        let desc = hw.data.description.split('http')
        let endminutes = end.getMinutes()
        let endhours = end.getHours()
        if (Number(endminutes) < 10) endminutes = `0${endminutes}`
        if (Number(endhours) < 10) endhours = `0${endhours}`
        let link = `http${desc[desc.length - 1]}`
        let description = String(desc.slice(0, desc.length - 1)).trim()
        if (desc.length == 1) {
            link = ''
            description = desc[0].trim()
        }

        var subject = hw.data.summary.split(':')[0].trim(),
            title = hw.data.summary.split(':')[1].trim(),
            date = `${hw.data.end.dateTime.split('T')[0]}`,
            time = `${endhours}:${endminutes}`
        if (link.trim() == 'http') link = ''

        res.render('newhw', { user: req.user, id, subject, title, date, time, description, link })
    } else {
        res.redirect('/account/create-hw')
    }
})

router.get('/delete-hw:id', isLoggedIn, async function (req, res) {
    let id = req.params.id
    await deleteHW(id)
    res.redirect('/')
})

//POSTS
router.post('/updatesubject', isLoggedIn, async function (req, res) {
    //get data from updatesubject.ejs
    var { id, subject, semester,
        per_final, tot_final,
        per_midterm, tot_midterm, per_each_midterm,
        per_quiz, tot_quiz, per_each_quiz,
        per_hw, tot_hw, per_each_hw,
        per_la, tot_la,
        per_attendance, tot_attendance,
        per_bonus, tot_bonus,
        meeting, classroom } = req.body

    semester = Number(semester)
    // set all data into arrays, initialize sums of percentages
    subject = subject.toUpperCase()
    let errors = []
    tot_midterm = tot_midterm.split(',')
    tot_quiz = tot_quiz.split(',')
    tot_hw = tot_hw.split(',')
    per_each_midterm = per_each_midterm.split(',')
    per_each_quiz = per_each_quiz.split(',')
    per_each_hw = per_each_hw.split(',')
    let tot_per_ech_midterm = 0, tot_per_ech_quiz = 0, tot_per_ech_hw = 0

    //Convert all strings to numbers
    for (x of tot_midterm) x = Number(x)
    for (x of tot_quiz) x = Number(x)
    for (x of tot_hw) x = Number(x)
    for (x of per_each_midterm) x = Number(x)
    for (x of per_each_quiz) x = Number(x)
    for (x of per_each_hw) x = Number(x)

    //The sum of percentages must be 100%
    let totalpercentage = Number(per_final) + Number(per_hw) + Number(per_la)
        + Number(per_midterm) + Number(per_quiz) + Number(per_attendance)
    if (totalpercentage != 100) {
        errors.push(`Error: The sum of percentages is ${totalpercentage}%.`)
    }

    //If a grade is set, also should be the percentage
    //The same the other way around
    if (toEmpy(per_final) != '' && toEmpy(tot_final) == '') {
        errors.push(`Error in FINAL EXAM: Set the max grade, or left empy the percentage.`)
    }
    if (toEmpy(per_final) == '' && toEmpy(tot_final) != '') {
        errors.push(`Error in FINAL EXAM:  Set the percentage, or let empy the max grade.`)
    }
    if (toEmpy(per_midterm) != '' && toEmpy(tot_midterm) == '') {
        errors.push(`Error in MIDTERM: Set the max grade, or left empy the percentage.`)
    }
    if (toEmpy(per_midterm) == '' && toEmpy(tot_midterm) != '') {
        errors.push(`Error in MIDTERM: Set the percentage, or let empy the max grade.`)
    }
    if (toEmpy(per_quiz) != '' && toEmpy(tot_quiz) == '') {
        errors.push(`Error in QUIZZES: Set the max grade, or left empy the percentage.`)
    }
    if (toEmpy(per_quiz) == '' && toEmpy(tot_quiz) != '') {
        errors.push(`Error in QUIZZES: Set the percentage, or let empy the max grade.`)
    }
    if (toEmpy(per_hw) != '' && toEmpy(tot_hw) == '') {
        errors.push(`Error in HOMEWORKS: Set the max grade, or left empy the percentage.`)
    }
    if (toEmpy(per_hw) == '' && toEmpy(tot_hw) != '') {
        errors.push(`Error in HOMEWORKS: Set the percentage, or let empy the max grade.`)
    }
    if (toEmpy(per_la) != '' && toEmpy(tot_la) == '') {
        errors.push(`Error in LEARNING ATTITUDE: Set the max grade, or left empy the percentage.`)
    }
    if (toEmpy(per_la) == '' && toEmpy(tot_la) != '') {
        errors.push(`Error in LEARNING ATTITUDE: Set the percentage, or let empy the max grade.`)
    }
    if (toEmpy(per_attendance) != '' && toEmpy(tot_attendance) == '') {
        errors.push(`Error in LEARNING ATTENDANCE: Set the max grade, or left empy the percentage.`)
    }
    if (toEmpy(per_attendance) == '' && toEmpy(tot_attendance) != '') {
        errors.push(`Error in LEARNING ATTENDANCE: Set the percentage, or let empy the max grade.`)
    }
    if (toEmpy(per_bonus) != '' && toEmpy(tot_bonus) == '') {
        errors.push(`Error in BONUS: Set the max grade, or left empy the percentage.`)
    }
    if (toEmpy(per_bonus) == '' && toEmpy(tot_bonus) != '') {
        errors.push(`Error in BONUS: Set the percentage, or let empy the max grade.`)
    }

    //The percentage per each element can by empy, buty if not or there aren't number in it, is an error
    for (x of per_each_midterm) {
        if (isNaN(x)) errors.push(`Error in MIDTERM: In percentages just put commas and numbers.`)
        else tot_per_ech_midterm = tot_per_ech_midterm + Number(x)
    }
    for (x of per_each_quiz) {
        if (isNaN(x)) errors.push(`Error in QUIZZES: In percentages just put commas and numbers.`)
        else tot_per_ech_quiz = tot_per_ech_quiz + Number(x)
    }
    for (x of per_each_hw) {
        if (isNaN(x)) errors.push(`Error in HOMEWORK: In percentages just put commas and numbers.`)
        else tot_per_ech_hw = tot_per_ech_hw + Number(x)
    }
    for (x of tot_midterm) {
        if (isNaN(x)) errors.push(`Error in MIDTERM: In grades just put commas and numbers.`)
    }
    for (x of tot_quiz) {
        if (isNaN(x)) errors.push(`Error in QUIZZES: In grades just put commas and numbers.`)
    }
    for (x of tot_hw) {
        if (isNaN(x)) errors.push(`Error in HOMEWORK: In grades just put commas and numbers.`)
    }

    //Percentages can be zero, but if not their sum is to be the same as the total of the item
    if (tot_per_ech_hw != 0 && Math.abs(tot_per_ech_hw - per_hw) > 1) errors.push(`Error in HOMEWORK: The sum of the percentage is not the same as the percentage of the HW.`)
    if (tot_per_ech_midterm != 0 && Math.abs(tot_per_ech_midterm - per_midterm) > 1) errors.push(`Error in MIDTERM: The sum of the percentage is not the same as the percentage of the MID.`)
    if (tot_per_ech_quiz != 0 && Math.abs(tot_per_ech_quiz - per_quiz) > 1) errors.push(`Error in QUIZZES: The sum of the percentage is not the same as the percentage of the MID.`)

    //We have to have the same number of percentages that of grades
    if (per_each_midterm.length != tot_midterm.length) {
        if (per_each_midterm[0] != '') errors.push(`Error in MIDTERM: The quantity of percentages and grades are not the same.`)
    }
    if (per_each_quiz.length != tot_quiz.length) {
        if (per_each_quiz[0] != '') errors.push(`Error in QUIZZES: The quantity of percentages and grades are not the same.`)
    }
    if (per_each_hw.length != tot_hw.length) {
        if (per_each_hw[0] != '') errors.push(`Error in HOMEWORK: The quantity of percentages and grades are not the same.`)
    }

    //Check is subject name is repeated
    let subj = await Subject.findOne({ subject: subject })
    if (subj != null && id == '') errors.push(`Already exists a subject named ${subject}`)

    if (errors.length > 0) {
        res.render('updatesubject', {
            id, user: req.user,
            errors, subject, semester, per_final, tot_final,
            per_midterm, tot_midterm, per_each_midterm,
            per_quiz, tot_quiz, per_each_quiz,
            per_hw, tot_hw, per_each_hw,
            per_la, tot_la,
            per_attendance, tot_attendance,
            per_bonus, tot_bonus, meeting, classroom
        });
    }
    // ---------------------------
    // if not errors, SAVE SUBJECT
    // ---------------------------
    else {
        // if we're updating, get data to compare
        if (id != '') var tempSubject = await Subject.findOne({ _id: id })
        // initialize to use if the subject is new
        var itemArray = []
        var grades = [{ user: null, grade: null }]

        //If per_each_midterm is empy, then every item shall have the same percentage
        if (per_each_midterm[0] == '' && tot_midterm[0] != '') {
            per_each_midterm = []
            for (i in tot_midterm) {
                per_each_midterm.push(Number(per_midterm) / tot_midterm.length)
            }
        }

        if (per_each_quiz[0] == '' && tot_quiz[0] != '') {
            per_each_quiz = []
            for (i in tot_quiz) {
                per_each_quiz.push(Number(per_quiz) / tot_quiz.length)
            }
        }

        if (per_each_hw[0] == '' && tot_hw[0] != '') {
            per_each_hw = []
            for (i in tot_hw) {
                per_each_hw.push(Number(per_hw) / tot_hw.length)
            }
        }

        //ADD FINAL EXAM
        if (id != '') grades = tempSubject.items[0].data[0].grades
        itemArray.push({
            item: 'Final Exam',
            percentage: per_final,
            data:
                [{
                    percentage: per_final,
                    total: tot_final,
                    grades: grades
                }],
        })

        //ADD MIDTERM
        //data is the prototype of what is send into the db
        let data = []
        //for each midterm we're using an element into an array called data[]
        for (i in tot_midterm) {
            //subject is updated, we're copying the grades already in the db
            if (id != '' && tempSubject.items[1].data[i] != undefined) grades = tempSubject.items[1].data[i].grades
            // if is new, we create an elmpy first grade
            else for (elem of grades) elem.grade = null
            data.push({
                percentage: per_each_midterm[i],
                total: tot_midterm[i],
                index: i, //index is required to do the consult to the db
                grades: grades
            })
        }
        grades = [{ user: null, grade: null }]

        itemArray.push({
            item: 'Midterm Exam',
            percentage: per_midterm,
            data: data
        })

        //ADD HW
        data = []
        for (i in tot_hw) {
            if (id != '' && tempSubject.items[2].data[i] != undefined) {
                grades = tempSubject.items[2].data[i].grades

                data.push({
                    percentage: per_each_hw[i],
                    total: tot_hw[i],
                    index: i,
                    grades: grades
                })

            } else if (id != '' && tempSubject.items[2].data[i] == undefined) {
                let newgrades = []
                for (elem of grades) newgrades.push({ user: elem.user, grade: null })

                data.push({
                    percentage: per_each_hw[i],
                    total: tot_hw[i],
                    index: i,
                    grades: newgrades
                })

            } else {
                data.push({
                    percentage: per_each_hw[i],
                    total: tot_hw[i],
                    index: i,
                    grades: grades
                })
            }

        }
        grades = [{ user: null, grade: null }]

        itemArray.push({
            item: 'Homework',
            percentage: per_hw,
            data: data
        })
        //ADD LA
        if (id != '') grades = tempSubject.items[3].data[0].grades
        itemArray.push({
            item: 'Learning Attitude',
            percentage: per_la,
            data:
                [{
                    percentage: per_la,
                    total: tot_la,
                    grades: grades
                }]
        })

        //ADD ATTENDANCE
        if (id != '') grades = tempSubject.items[4].data[0].grades
        itemArray.push({
            item: 'Attendance',
            percentage: per_attendance,
            data:
                [{
                    percentage: per_attendance,
                    total: tot_attendance,
                    grades: grades
                }]
        })

        //ADD BONUS
        if (id != '') grades = tempSubject.items[5].data[0].grades
        itemArray.push({
            item: 'Bonus',
            percentage: per_bonus,
            data:
                [{
                    percentage: per_bonus,
                    total: tot_bonus,
                    grades: grades
                }]
        })

        //ADD QUIZZES
        data = []
        for (i in tot_quiz) {
            if (id != '' && tempSubject.items[6].data[i] != undefined) grades = tempSubject.items[6].data[i].grades
            else for (elem of grades) elem.grade = null
            data.push({
                percentage: per_each_quiz[i],
                total: tot_quiz[i],
                index: i,
                grades: grades
            })
        }
        grades = [{ user: null, grade: null }]

        itemArray.push({
            item: 'Quiz',
            percentage: per_quiz,
            data: data
        })

        //Set the modifyby array, if is updating get from db and and the current user
        //This action if call 'modifying', everytime this post is proceced we will register
        var modifiedby = []

        if (id == '') {
            modifiedby = [{ user: req.user.email, date: Date.now() }]
        } else {
            modifiedby = tempSubject.modifiedby
            modifiedby.push({ user: req.user.email, date: Date.now() })
        }

        if (id != '') grades = tempSubject.totalgrade

        var enrolled = []
        if (id != '') {
            enrolled = tempSubject.enrolled
        }

        let updatesubject = {
            subject: subject,
            meeting: meeting,
            classroom: classroom,
            semester: semester,
            modifiedby: modifiedby,
            items: itemArray,
            totalgrade: grades,
            enrolled: enrolled
        }
        const saveSubject = new Subject(updatesubject)

        //Save or update
        if (id == '') {
            await saveSubject.save()
        } else {
            await Subject.findOneAndReplace({ '_id': id }, updatesubject)
            // Change name of the subject
            if (subject != tempSubject.subject) {
                //Update name of subjects in User
                await User.updateMany({ $in: { enrolled: { id: id } } }, {
                    enrolled: { id: id, subject: subject },
                })

                for (i of req.user.enrolled) {
                    if (i.id == id) {
                        i.id = id
                        i.subject = subject
                    }
                }

                //pdate name of subjects into calendars
                await updateSubjectName(tempSubject.subject, subject)
            }
        }

        if (id == '') res.redirect('/account/courses')
        else res.redirect(`/account/course${id}`)
    }

})

router.post('/setgrades', isLoggedIn, async function (req, res) {
    // post function use two values, the grade to update, and the 'key' (label of what tag update)
    var value = req.body.value
    var totalgrade = Number(req.body.grade_total)
    var key = req.body.key
    var user = req.user.googleId
    var index = req.body.key

    if (key.includes('final')) key = 'Final Exam'
    else if (key.includes('mt')) key = 'Midterm Exam'
    else if (key.includes('quiz')) key = 'Quiz'
    else if (key.includes('hw')) key = 'Homework'
    else if (key.includes('la')) key = 'Learning Attitude'
    else if (key.includes('attendance')) key = 'Attendance'
    else if (key.includes('bonus')) key = 'Bonus'

    index = index.replace(/^\D+/g, '')
    if (index == '') index = 0

    //update in db
    await Subject.findOneAndUpdate(
        { _id: req.body.id },
        {
            $set: {
                "items.$[elem].data.$[arr].grades.$[thing].grade": value,
                "totalgrade.$[thing].grade": totalgrade
            }
        },
        {
            arrayFilters: [
                { "elem.item": key },
                { "thing.user": user },
                { "arr.index": index }
            ]
        }
    )
    // console.log(`item.[${key}].data.[${index}].grades.[${user}].grade = ${value}`)
})

router.post('/addsubject', isLoggedIn, async function (req, res) {
    var { idadd } = req.body
    var subjectAdd = await Subject.findOne({ _id: idadd })

    // ADD CLASS TO USER
    // in db
    await User.findOneAndUpdate({ _id: req.user._id }, {
        $push: {
            enrolled: { id: subjectAdd._id, subject: subjectAdd.subject },
        }
    })
    // in server
    req.user.enrolled.push({ id: subjectAdd._id, subject: subjectAdd.subject })

    // ADD USER TO CLASS
    // in db
    if (req.user._id != null) {
        let newUser = true
        for (x of subjectAdd.items[0].data[0].grades) if (x.user == req.user.googleId) newUser = false

        if (newUser) {
            await Subject.findOneAndUpdate(
                { _id: subjectAdd._id },
                {
                    $push: {
                        "items.$[elem].data.$[elem].grades": { grade: '', user: req.user.googleId },
                        "totalgrade": { grade: '', user: req.user.googleId },
                        "enrolled": req.user.googleId
                    }
                },
                {
                    arrayFilters: [
                        { "elem": { $exists: true } }
                    ]
                }
            )
        } else {
            await Subject.findOneAndUpdate(
                { _id: subjectAdd._id },
                {
                    $push: {
                        "enrolled": req.user.googleId
                    }
                }
            )
        }
    }

    res.redirect('/account/courses')
})

router.post('/removesubject', isLoggedIn, async function (req, res, next) {
    var { idremove } = req.body
    var subjectRemove = await Subject.findOne({ _id: idremove })

    // REMOVE USER FROM CLASS
    await Subject.findOneAndUpdate({ _id: idremove }, {
        $pull: {
            enrolled: req.user.googleId,
        }
    })

    //REMOVE CLASS FROM USER
    // In db
    await User.findOneAndUpdate({ _id: req.user._id }, {
        $pull: {
            enrolled: { id: subjectRemove._id },
        }
    })

    //In server
    let newEnroledds = await User.findOne({ _id: req.user._id })
    req.user.enrolled = newEnroledds.enrolled

    res.redirect('/account/courses')
})

router.post('/updatehw', isLoggedIn, async function (req, res) {
    let idhw
    if (req.body.id == '') idhw = await createHW(req.body)
    else idhw = await updateHW(req.body)

    res.redirect(`/account/update-hw${idhw}`)
})

//ADMIN STUFF
router.post('/deletecourse', isLoggedIn, async function (req, res) {
    Subject.findById(req.body.id, async (err, subject) => {
        if (err || subject == null) {
            res.status(200).send({ error: 'wrong id' })
        } else if (req.body.subject != subject.subject || req.body.lastModify != subject.modifiedby[subject.modifiedby.length - 1].user) {
            res.status(200).send({ error: 'wrong data' })
        } else {
            await Subject.updateOne({ _id: subject._id },
                { enrolled: [] }
            )
            await User.updateMany({ $in: { enrolled: { id: subject._id } } }, {
                $pull: {
                    enrolled: { id: subject._id },
                }
            })
        }
    })
})

module.exports = router;