1. Create a folder in your computer and clone the project
   ```
   git clone https://github.com/ICTaBIN/cFigureFence.git
   ```
2. change directory to the cloned folder directory
   ```
   cd primeFigureFence
   ```
3. Once inside your directory, Check if git folder exists by running status command
   ```
   git status
   ```
4. If everything is good, you should see something like
   `On branch master
   Your branch is up to date with 'origin/master'`
5. Now check which branch you are on by running
   ```
   git branch
   ```
   if it is your first time you will see a star with 'master'(the star represents the active branch)
6. Now if you have to start working you can either do
   ```
   git switch -c BRANCH_NAME
   ```
   replace BRANCH_NAME  with any branch name like 'google-auth-feature', 'fixing-app', 'converting-to-flask' so on

   Running this command will create a new branch of your chosen name and switch you to that branch(check it using `git branch`; the star
   symbol)

   
   
   
