const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "تم تجاوز الحد المسموح به للبحث، يرجى المحاولة لاحقاً." }
});
app.use('/api/', limiter);

app.use(express.static(path.join(process.cwd(), 'public')));

const studentsData = new Map();

try {
    // قراءة البيانات من ملف JSON (سريع جداً وخفيف على السيرفر)
    const data = require('./data.json'); 
    
    data.forEach(student => {
        const seatingKey = student['رقم الجلوس'] || student['Seating_No'] || student['رقم_الجلوس'];
        if(seatingKey) {
            studentsData.set(seatingKey.toString(), student);
        }
    });
    console.log("تم تحميل البيانات بنجاح");
} catch (error) {
    console.error("خطأ في قراءة ملف JSON:", error);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/api/result/:seatingNo', (req, res) => {
    const seatingNo = req.params.seatingNo;
    
    if (studentsData.has(seatingNo)) {
        const student = studentsData.get(seatingNo);
        res.json({
            success: true,
            data: {
                name: student['الاسم'] || student['اسم الطالب'] || 'غير متوفر',
                degree: student['المجموع'] || student['المجموع الكلي'] || 'غير متوفر'
            }
        });
    } else {
        res.status(404).json({ success: false, message: 'رقم الجلوس غير صحيح أو غير موجود' });
    }
});

module.exports = app;