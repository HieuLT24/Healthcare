import { Image, ScrollView, Text, TouchableOpacity, View, Alert, Platform } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { use, useState } from "react";
import * as ImagePicker from 'expo-image-picker';
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../../configs/Apis";
const Register = () => {
    const info = [{
        label: 'Tên',
        field: 'first_name',
        secureTextEntry: false,
        icon: "text"
    }, {
        label: 'Họ và tên lót',
        field: 'last_name',
        secureTextEntry: false,
        icon: "text"
    }, {
        label: 'Tên đăng nhập',
        field: 'username',
        secureTextEntry: false,
        icon: "account"
    }, {
        label: 'Mật khẩu',
        field: 'password',
        secureTextEntry: true,
        icon: "eye"
    }, {
        label: 'Xác nhận mật khẩu',
        field: 'password2',
        secureTextEntry: true,
        icon: "eye"
    }];
    const [user, setUser] = useState({});
    const [msg, setMsg] = useState();
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const [secureEntry, setSecureEntry] = useState({})
    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    }

    const picker = async () => {
        let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled)
                setState(result.assets[0], 'avatar');
        }
    }

    const validate = () => {
        if (Object.values(user).length === 0) {
            setMsg("Vui lòng nhập thông tin!");
            return false;
        }

        for (let i of info)
            if (user[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}`);
                return false;
            }

        if (user.password !== user.password2) {
            setMsg('Mật khẩu không khớp!');
            return false;
        }

        setMsg("");
        return true;
    }

    const toggleSecureEntry = (field) => {
        setSecureEntry(prev => ({ ...prev, [field]: !prev[field] }));

    }


    const register = async () => {
        if (validate() === true) {
            try {
                setLoading(true);

                let form = new FormData();
                
                // Thêm các trường cơ bản một cách rõ ràng
                form.append('first_name', user.first_name || '');
                form.append('last_name', user.last_name || '');
                form.append('username', user.username || '');
                form.append('password', user.password || '');
                form.append('password2', user.password2 || '');
                
                // Xử lý avatar nếu có
                if (user.avatar) {
                    form.append('avatar', {
                        uri: user.avatar.uri,
                        name: user.avatar.fileName || `avatar-${Date.now()}.jpeg`,
                        type: user.avatar.mimeType || 'image/jpeg'
                    });
                }

                console.log('Form data fields:', form._parts.map(p => p[0]));
                
                const response = await Apis.post(endpoints['register'], form, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 15000
                });
                
                if (response.status === 201) {
                    Alert.alert("Thành công", "Đăng ký thành công!", [
                        {
                            text: "OK",
                            onPress: () => nav.navigate('login')
                        }
                    ]);
                }
            } catch (ex) {
                console.error("Register error:", ex);
                
                let errorMessage = "Đăng ký không thành công. ";
                
                if (ex.response) {
                    // Chi tiết lỗi từ server
                    console.log("Server response:", ex.response.status);
                    console.log("Error data:", ex.response.data);
                    
                    if (typeof ex.response.data === 'object') {
                        // Xử lý lỗi trả về dạng object
                        const errors = [];
                        for (const [field, msgs] of Object.entries(ex.response.data)) {
                            if (Array.isArray(msgs)) {
                                errors.push(`${field}: ${msgs.join(', ')}`);
                            } else {
                                errors.push(`${field}: ${msgs}`);
                            }
                        }
                        errorMessage += errors.join('\n');
                    } else {
                        errorMessage += ex.response.data || `Mã lỗi: ${ex.response.status}`;
                    }
                } else {
                    errorMessage += ex.message;
                }
                
                Alert.alert("Lỗi", errorMessage);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView style={MyStyles.p}>
            <HelperText type="error" visible={msg}>{msg}</HelperText>

            {info.map(i => <TextInput key={`Register${i.field}`} value={user[i.field]}
                onChangeText={t => setState(t, i.field)}
                label={i.label} style={[MyStyles.m, MyStyles.bg]}
                secureTextEntry={i.secureTextEntry && secureEntry[i.field] !== false}
                right={i.secureTextEntry ? (
                    <TextInput.Icon
                        icon={secureEntry[i.field] === false ? "eye" : "eye-off"}
                        onPress={() => toggleSecureEntry(i.field)}
                    />
                ) : (
                    <TextInput.Icon icon={i.icon} />
                )} />)}

            <TouchableOpacity style={MyStyles.m} onPress={picker}>
                <Text>Chọn ảnh đại diện...</Text>
            </TouchableOpacity>

            {user.avatar && <Image source={{ uri: user.avatar.uri }} style={[MyStyles.avatar, MyStyles.m]} />}

            <Button disabled={loading} loading={loading} onPress={register} mode="contained" style={[MyStyles.m, MyStyles.bg]} textColor="#065f46">Đăng ký</Button>
        </ScrollView>
    );
}

export default Register;