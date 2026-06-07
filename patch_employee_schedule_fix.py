# -*- coding: utf-8 -*-
"""
ANG HR employee.html 週/月選休週期修正自動安裝器
用法：把本檔、ang_schedule_cycle_fix.js、employee.html 放同一個資料夾，執行：
  python patch_employee_schedule_fix.py
會自動備份 employee.html.bak_schedule_cycle_fix，並在 </body> 前加入修正 JS。
"""
from pathlib import Path
import sys

EMPLOYEE = Path('employee.html')
FIX_JS = Path('ang_schedule_cycle_fix.js')
MARK_START = '<!-- ANG HR Schedule Cycle Fix v1 START -->'
MARK_END = '<!-- ANG HR Schedule Cycle Fix v1 END -->'
BLOCK = f'''{MARK_START}\n<script src="./ang_schedule_cycle_fix.js?v=20260607-cycle-fix"></script>\n{MARK_END}'''

if not EMPLOYEE.exists():
    print('❌ 找不到 employee.html，請把本檔放在 employee.html 同一個資料夾。')
    sys.exit(1)
if not FIX_JS.exists():
    print('❌ 找不到 ang_schedule_cycle_fix.js，請確認修正 JS 在同一個資料夾。')
    sys.exit(1)

text = EMPLOYEE.read_text(encoding='utf-8')
backup = Path('employee.html.bak_schedule_cycle_fix')
if not backup.exists():
    backup.write_text(text, encoding='utf-8')

if MARK_START in text and MARK_END in text:
    before = text.split(MARK_START)[0]
    after = text.split(MARK_END, 1)[1]
    text = before + BLOCK + after
elif '</body>' in text:
    text = text.replace('</body>', BLOCK + '\n</body>', 1)
elif '</BODY>' in text:
    text = text.replace('</BODY>', BLOCK + '\n</BODY>', 1)
else:
    text = text + '\n' + BLOCK + '\n'

EMPLOYEE.write_text(text, encoding='utf-8', newline='\n')
print('✅ 完成：employee.html 已加入週/月選休週期修正')
print('✅ 備份：employee.html.bak_schedule_cycle_fix')
