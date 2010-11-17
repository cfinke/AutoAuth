rm -rf `find ./ -name ".DS_Store"`
rm -rf `find ./ -name "Thumbs.db"`

rm ~/Desktop/autoauth.xpi
rm -rf .tmp_xpi_dir/

chmod -R 0777 autoauth/

mkdir .tmp_xpi_dir/
cp -r autoauth/* .tmp_xpi_dir/
rm -rf `find ./.tmp_xpi_dir/ -name ".git"`

cd .tmp_xpi_dir/
zip -rq ~/Desktop/autoauth.xpi *
cd ../
rm -rf .tmp_xpi_dir/
