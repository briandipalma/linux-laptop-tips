for i in $(git branch -r)
do
	if [[ ${i} == *"master"* ]] || [ ${i} == "->" ] || [[ ${i} == *"1.8.4"* ]] || [[ ${i} == *"HEAD"* ]]
	then
		printf "Skip ${i}\n\n"
	else
		printf "Creating branch for ${i}\n\n"

		git checkout -q -b ${i:7} ${i}
		git pull -q
		sleep 2
		git merge -q master
		# git merge -q --no-commit master
		sleep 2
		# git merge --abort
		sleep 2
		git push -q
	fi
done

