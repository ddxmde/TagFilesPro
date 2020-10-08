!macro customInstall
  WriteRegStr HKCR "*\shell\添加文件到TagFiles\command" "" '"$INSTDIR\TagFiles.exe" "%1" "1"'
!macroend
!macro customUninstall
  DeleteRegKey HKCR "*\shell\添加文件到TagFiles"
  DeleteRegKey HKCR "*\shell\添加标签到TagFiles"
!macroend