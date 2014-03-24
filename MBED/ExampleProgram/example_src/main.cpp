// Hello World! for the TextLCD

#include "mbed.h"
#include "TextLCD.h"
#include "MicIO.h"

MicIO micIO(p18,p17);

int main() {
    wait(1);
    //41:42:43:44:45:46:47:48:49:4a:4b:4c:4d:4e:4f:50:51:52:53:54:55:56:57:58:59:5a:61:62:63:64:65:66:67:68:69:6a:6b:6c:6d:6e:6f:70:71:72:73:74:75:76:77:78:79:7a:31:32:33:34:35:36:37:38:39:30
    micIO.send("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890", 62);
}

