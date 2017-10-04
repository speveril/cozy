@echo off
set RCEDIT=tool\rcedit.exe
%RCEDIT% %1 --set-icon cozy.ico
%RCEDIT% %1 --set-version-string "FileDescription" "Cozy Engine"
%RCEDIT% %1 --set-version-string "ProductName" "Cozy Engine"
%RCEDIT% %1 --set-version-string "LegalCopyright" "Copyright (C) 2017 Shamus Peveril"
%RCEDIT% %1 --set-version-string "OriginalFilename" "cozy.exe"
