Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\izanc\.gemini\antigravity\scratch\universe-map"

Dim pyPath
pyPath = "C:\Users\izanc\AppData\Local\Programs\Python\Python37\pythonw.exe"

Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FileExists(pyPath) Then
    pyPath = "pythonw.exe"
End If

WshShell.Run """" & pyPath & """ run_app.py", 0, False
