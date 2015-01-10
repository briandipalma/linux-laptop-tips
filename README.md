linux-laptop-cheat-sheet
=================

`sudo modprobe i8k force=1`

`sensors` (lm_sensors) - prints out hardware sensors reading, includes temp/fan speed

Set right fan on high and leaves the left unchanged

`i8kfan - 2`

http://www.cyberciti.biz/faq/controlling-dell-fan-speeds-temperature-on-ubuntu-debian-linux

https://ask.fedoraproject.org/question/25197/fan-on-my-laptop-runs-all-the-time-at-maximum-speed/

No more sudo
------------

I recommend doing this once instead:

`sudo chown -R $USER /usr/local`

That sets your user account as the owner of the /usr/local directory, so that you can just issue normal commands in there. Then you won't ever have to use sudo when you install node or issue npm commands.

It's much better this way. `/usr/local` is supposed to be the stuff you installed, after all.

Install brackets
----------------

`sudo yum locainstall x.rpm`

`sudo chown $USER /opt/brackets/brackets.desktop`

Prompt
------

https://github.com/nojhan/liquidprompt


Synergy
---------

http://superuser.com/questions/77734/synergy-linux-keyboard-problem

Power management
----------------

sudo pm-powersave false

/usr/lib/pm-utils/power.d/wireless
