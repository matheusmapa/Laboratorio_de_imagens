Set WshShell = CreateObject("WScript.Shell")

' Roda a IA em background sem poluir a tela
WshShell.Run "cmd /c antigravity .", 0, False

' Inicia o servidor local do Laboratório
WshShell.Run "cmd /k title Laboratorio de Imagens && color 0B && echo [ SYSTEM ] Laboratorio de Imagens no ar! && echo Pode minimizar esta tela. && echo. && npm run dev", 1, False
