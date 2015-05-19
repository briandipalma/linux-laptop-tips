for i in $(find . -maxdepth 1 -type d)
do
    echo ${i:2}/ >> .eslintignore
done
