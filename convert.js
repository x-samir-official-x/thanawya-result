const xlsx = require('xlsx');
const fs = require('fs');

console.log('جاري قراءة ملف الإكسيل...');
const workbook = xlsx.readFile('نتيجة ثانوية عامة نظام حديث (1).xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// فلترة البيانات عشان ناخد المطلوب بس ونصغر حجم الملف جداً
const optimizedData = data.map(student => {
    return {
        "رقم الجلوس": student['رقم الجلوس'] || student['Seating_No'] || student['رقم_الجلوس'],
        "الاسم": student['الاسم'] || student['اسم الطالب'],
        "المجموع": student['المجموع'] || student['المجموع الكلي']
    };
}).filter(student => student['رقم الجلوس']); // تجاهل أي صفوف فارغة

fs.writeFileSync('data.json', JSON.stringify(optimizedData));
console.log('تم ضغط البيانات وتحويلها بنجاح 🚀');