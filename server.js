const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const rateLimit = require('express-rate-limit');

const app = express();

// إعدادات الحماية
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "تم تجاوز الحد المسموح به للبحث، يرجى المحاولة لاحقاً." }
});
app.use('/api/', limiter);

// توجيه ملفات التصميم بمسار Vercel الصحيح
app.use(express.static(path.join(process.cwd(), 'public')));

// قراءة ملف الإكسيل
const filePath = path.join(process.cwd(), 'نتيجة ثانوية عامة نظام حديث (1).xlsx');
let studentsData = new Map();

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    data.forEach(student => {
        const seatingKey = student['رقم الجلوس'] || student['Seating_No'] || student['رقم_الجلوس'];
        if(seatingKey) {
            studentsData.set(seatingKey.toString(), student);
        }
    });
    console.log("تم تحميل البيانات بنجاح");
} catch (error) {
    console.error("خطأ في قراءة ملف الإكسيل:", error);
}

// السطر ده هو اللي هيحل مشكلة الـ 404 (بيعرض الصفحة الرئيسية)
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// مسار البحث عن النتيجة
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