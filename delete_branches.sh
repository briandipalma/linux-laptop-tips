branch_to_keep=$(git symbolic-ref --short HEAD)

for i in $(git branch)
do
	if [ ${i} == "master" ] || [ ${i} == $branch_to_keep ]
	then
		printf "Skipping ${i}\n"
	else
		printf "Deleting branch ${i}\n"

		git branch -D ${i}
	fi
done

