branch_to_test=$(git symbolic-ref --short HEAD)

for i in $(git branch -r)
do
	if [[ ${i} == *"master"* ]] || [ ${i} == "->" ] || [[ ${i} == *"1.8.4"* ]] || [[ ${i} == *"HEAD"* ]] || [[ ${i} == *$branch_to_test* ]]
	then
		printf "Skipping ${i}\n\n"
	else
		printf "Testing ${i}, merging ${branch_to_test}\n\n"

		# git checkout -q -b ${i:7} ${i}
		git checkout -q ${i:7}
		git pull -q
		sleep 2
		git merge -q ${branch_to_test}
		sleep 2
		# git merge -q --no-commit $branch_to_test
		# git merge --abort
		git push -q
	fi
done

